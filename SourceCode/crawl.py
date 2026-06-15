"""
Vinmec Bệnh Crawler – v4
=========================
Chiến lược:
  - KHÔNG dùng trang search (bị Cloudflare + JS render)
  - Trực tiếp duyệt trang danh mục bệnh: /vie/benh/
  - Mỗi trang hiển thị 10-20 bệnh, có phân trang ?page=N
  - Lưu từng bài .md

Nếu muốn crawl từ kết quả search theo từ khóa:
  → Bật chế độ SEARCH_MODE = True (dùng Selenium click tab)

Yêu cầu:
    pip install selenium webdriver-manager beautifulsoup4
"""

import os, re, time, random, urllib.parse
from bs4 import BeautifulSoup
from urllib.parse import urljoin

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

try:
    from selenium.webdriver.chrome.service import Service as ChromeService
    from webdriver_manager.chrome import ChromeDriverManager
    USE_MANAGER = True
except ImportError:
    USE_MANAGER = False


# ══════════════════════════════════════════════════════════
#  CẤU HÌNH
# ══════════════════════════════════════════════════════════

# --- Chế độ 1: Crawl toàn bộ danh mục /vie/benh/ ---
DISEASE_LIST_URL = "https://www.vinmec.com/vie/benh/"
MAX_LIST_PAGES   = 20          # số trang danh mục tối đa

# --- Chế độ 2: Crawl từ kết quả search (từ khóa cụ thể) ---
SEARCH_MODE      = True        # True = dùng từ khóa search bên dưới
SEARCH_KEYWORD   = "thiếu máu là gì"
MAX_SEARCH_PAGES = 0         # số lần bấm next/xem thêm

# --- Chung ---
SAVE_DIR         = r"D:\Documents\CRAWL\Medical\data\thiếu máu"
FILE_FORMAT      = "md"
HEADLESS         = True        # False = hiện browser để debug
WAIT_TIMEOUT     = 15
ARTICLE_WAIT     = 10
DELAY_MIN        = 1.5
DELAY_MAX        = 3.0

BASE_URL = "https://www.vinmec.com"


# ══════════════════════════════════════════════════════════
#  DRIVER
# ══════════════════════════════════════════════════════════

def create_driver():
    opts = Options()
    if HEADLESS:
        opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-blink-features=AutomationControlled")
    opts.add_experimental_option("excludeSwitches", ["enable-automation"])
    opts.add_experimental_option("useAutomationExtension", False)
    opts.add_argument("--window-size=1920,1080")
    opts.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )
    opts.add_argument("--lang=vi-VN")
    if USE_MANAGER:
        svc = ChromeService(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=svc, options=opts)
    else:
        driver = webdriver.Chrome(options=opts)
    driver.execute_cdp_cmd(
        "Page.addScriptToEvaluateOnNewDocument",
        {"source": "Object.defineProperty(navigator,'webdriver',{get:()=>undefined})"}
    )
    return driver


# ══════════════════════════════════════════════════════════
#  CÁCH A: Crawl danh mục /vie/benh/?page=N  (URL thay đổi)
# ══════════════════════════════════════════════════════════

def get_links_from_disease_listing(driver) -> list[str]:
    """Duyệt /vie/benh/?page=1,2,3... lấy link từng bệnh."""
    all_links = []
    seen = set()

    for page in range(1, MAX_LIST_PAGES + 1):
        url = f"{DISEASE_LIST_URL}?page={page}"
        print(f"  Danh mục trang {page}: {url}")
        driver.get(url)

        try:
            WebDriverWait(driver, WAIT_TIMEOUT).until(
                EC.presence_of_element_located(
                    (By.XPATH, "//a[contains(@href,'/benh/')]")
                )
            )
        except TimeoutException:
            time.sleep(3)

        soup = BeautifulSoup(driver.page_source, "html.parser")
        new = 0
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if "__slug__" in href:
                continue
            # Link bệnh: /vie/benh/ten-benh-SOID  (có số ở cuối)
            if re.search(r"/benh/[a-z0-9][a-z0-9\-]+-\d+", href):
                full = href if href.startswith("http") else urljoin(BASE_URL, href)
                if full not in seen:
                    seen.add(full)
                    all_links.append(full)
                    new += 1

        if new == 0:
            print(f"  Trang {page}: không có link mới → dừng.")
            break
        print(f"  Trang {page}: +{new} (tổng {len(all_links)})")
        time.sleep(random.uniform(1.0, 2.0))

    return all_links


# ══════════════════════════════════════════════════════════
#  CÁCH B: Crawl từ search → tự click tab Bệnh
# ══════════════════════════════════════════════════════════

def _collect_benh_links(driver) -> list[str]:
    """Lấy link /benh/ từ trang hiện tại."""
    soup = BeautifulSoup(driver.page_source, "html.parser")
    links = []
    seen = set()
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "__slug__" in href:
            continue
        if re.search(r"/benh/[a-z0-9][a-z0-9\-]+", href):
            full = href if href.startswith("http") else urljoin(BASE_URL, href)
            if "vinmec.com" in full and full not in seen:
                seen.add(full)
                links.append(full)
    return links


def _click_tab_benh(driver) -> bool:
    """
    Tìm và click tab 'Bệnh'.
    Vinmec render tab bằng JS → thử nhiều cách.
    """
    # Đợi trang load xong
    time.sleep(3)

    # In HTML để debug (chỉ chạy khi HEADLESS=False)
    if not HEADLESS:
        soup = BeautifulSoup(driver.page_source, "html.parser")
        tabs_area = soup.find_all(string=re.compile(r"Bệnh|Bai viet|Thuốc"))
        print(f"  [DEBUG] Tìm thấy {len(tabs_area)} text liên quan đến tab")

    strategies = [
        # XPath theo text chính xác
        ("XPATH", "//a[normalize-space(text())='Bệnh']"),
        ("XPATH", "//span[normalize-space(text())='Bệnh']"),
        ("XPATH", "//li[normalize-space(text())='Bệnh']"),
        ("XPATH", "//button[normalize-space(text())='Bệnh']"),
        # Chứa text
        ("XPATH", "//*[contains(text(),'Bệnh') and not(contains(text(),'bệnh viện')) and not(contains(text(),'chuyên khoa'))]"),
        # Theo role tab
        ("XPATH", "//*[@role='tab' and contains(.,'Bệnh')]"),
        # CSS selector
        ("CSS", "li.tab--active, li[class*='tab']"),
        ("CSS", "[data-tab='benh'], [data-type='benh'], [href*='benh']"),
    ]

    for method, selector in strategies:
        try:
            if method == "XPATH":
                els = driver.find_elements(By.XPATH, selector)
            else:
                els = driver.find_elements(By.CSS_SELECTOR, selector)

            for el in els:
                text = el.text.strip()
                if "Bệnh" in text and len(text) < 20:  # tránh match đoạn văn dài
                    driver.execute_script("arguments[0].scrollIntoView(true);", el)
                    time.sleep(0.3)
                    driver.execute_script("arguments[0].click();", el)
                    print(f"  ✓ Đã click tab 'Bệnh' (selector: {selector[:50]})")
                    time.sleep(3)
                    return True
        except Exception:
            continue

    # Fallback: dump tất cả text ngắn trong trang để debug
    print("  [!] Không click được tab 'Bệnh'. Dump các element ngắn:")
    try:
        els = driver.find_elements(By.XPATH, "//*[string-length(normalize-space(text()))>0 and string-length(normalize-space(text()))<15]")
        tab_candidates = [e.text.strip() for e in els if e.text.strip() and e.is_displayed()]
        unique_short = list(dict.fromkeys(tab_candidates))[:30]
        print("  Các text ngắn hiển thị:", unique_short)
    except Exception:
        pass
    return False


def _paginate_and_collect(driver) -> list[str]:
    """Sau khi ở đúng tab Bệnh, click qua các trang và gom link."""
    all_links = []
    seen = set()

    def add(links):
        n = 0
        for l in links:
            if l not in seen:
                seen.add(l)
                all_links.append(l)
                n += 1
        return n

    # Trang đầu
    new = add(_collect_benh_links(driver))
    print(f"  Trang 1: +{new} (tổng {len(all_links)})")

    for i in range(1, MAX_SEARCH_PAGES + 1):
        # Thử các loại nút next/xem thêm
        next_xpaths = [
            # Nút ">" hoặc "next"
            "//a[contains(@class,'next') or @aria-label='Next' or normalize-space(text())='>']",
            "//button[contains(@class,'next')]",
            # Số trang: tìm trang active rồi lấy trang kế
            "//ul[contains(@class,'paginat') or contains(@class,'page')]//li[contains(@class,'active') or contains(@class,'current')]/following-sibling::li[1]/a",
            # Xem thêm
            "//*[contains(normalize-space(text()),'Xem thêm') or contains(normalize-space(text()),'xem thêm')]",
        ]
        clicked = False
        for xpath in next_xpaths:
            try:
                btn = driver.find_element(By.XPATH, xpath)
                if btn.is_displayed() and btn.is_enabled():
                    driver.execute_script("arguments[0].scrollIntoView(true);", btn)
                    time.sleep(0.5)
                    driver.execute_script("arguments[0].click();", btn)
                    time.sleep(3)
                    new = add(_collect_benh_links(driver))
                    print(f"  Trang {i+1}: +{new} (tổng {len(all_links)})")
                    clicked = True
                    if new == 0:
                        return all_links
                    break
            except NoSuchElementException:
                continue

        if not clicked:
            print("  Hết trang.")
            break

    return all_links


def get_links_from_search(driver) -> list[str]:
    """Mở search, click tab Bệnh, gom link."""
    url = "https://www.vinmec.com/vie/ket-qua-tim-kiem/?q=" + urllib.parse.quote(SEARCH_KEYWORD)
    print(f"  Mở: {url}")
    driver.get(url)

    # Đợi trang load
    try:
        WebDriverWait(driver, WAIT_TIMEOUT).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
    except TimeoutException:
        pass
    time.sleep(4)

    _click_tab_benh(driver)
    return _paginate_and_collect(driver)


# ══════════════════════════════════════════════════════════
#  TRÍCH XUẤT NỘI DUNG BÀI BỆNH
# ══════════════════════════════════════════════════════════

def extract_article(driver, url: str) -> tuple[str, str]:
    driver.get(url)
    try:
        WebDriverWait(driver, ARTICLE_WAIT).until(
            EC.presence_of_element_located((By.TAG_NAME, "h1"))
        )
    except TimeoutException:
        time.sleep(3)

    soup = BeautifulSoup(driver.page_source, "html.parser")

    # Tiêu đề
    h1 = soup.find("h1")
    title = h1.get_text(strip=True) if h1 else url.rstrip("/").split("/")[-1]
    title = re.sub(r"\s*\|\s*Vinmec.*$", "", title).strip()

    # Mô tả
    og_desc = soup.find("meta", property="og:description")
    desc = og_desc["content"].strip() if og_desc else ""

    # Nội dung: thử nhiều selector
    content = (
        soup.select_one("div.single-post__content")
        or soup.select_one("div.article__content")
        or soup.select_one("div.article-content")
        or soup.select_one("div.content-detail")
        or soup.select_one("div.post-content")
        or soup.select_one("article")
        or soup.select_one("main")
        or soup.body
    )

    if content:
        for bad in content.select(
            "nav,footer,header,script,style,.breadcrumb,.related-posts,"
            ".sidebar,.social-share,.tag-list,.doctor-info,"
            "[class*='banner'],[class*='widget'],[class*='menu'],[class*='nav']"
        ):
            bad.decompose()

    parts = [f"# {title}\n"]
    if desc:
        parts.append(f"> {desc}\n")
    parts.append(f"> Nguồn: {url}\n---\n")

    if content:
        for el in content.find_all(
            ["h1","h2","h3","h4","h5","p","ul","ol","blockquote","table"],
            recursive=True
        ):
            tag = el.name
            if tag in ("h1","h2","h3","h4","h5"):
                lvl = int(tag[1])
                txt = el.get_text(" ", strip=True)
                if txt and txt != title:
                    parts.append(f"\n{'#'*lvl} {txt}\n")
            elif tag == "p":
                txt = el.get_text(" ", strip=True)
                if txt:
                    parts.append(txt + "\n")
            elif tag in ("ul","ol"):
                for li in el.find_all("li", recursive=False):
                    t = li.get_text(" ", strip=True)
                    if t:
                        parts.append(f"  {'- ' if tag=='ul' else '1. '}{t}\n")
            elif tag == "blockquote":
                t = el.get_text(" ", strip=True)
                if t:
                    parts.append(f"> {t}\n")
            elif tag == "table":
                rows = []
                for tr in el.find_all("tr"):
                    cells = [td.get_text(" ", strip=True) for td in tr.find_all(["th","td"])]
                    if any(cells):
                        rows.append(" | ".join(cells))
                if rows:
                    parts.append("\n" + "\n".join(rows) + "\n")
    else:
        parts.append("(Không trích xuất được nội dung)\n")

    return title, "\n".join(parts).strip()


# ══════════════════════════════════════════════════════════
#  LƯU FILE
# ══════════════════════════════════════════════════════════

def safe_name(s, maxlen=120):
    return re.sub(r'\s+', " ", re.sub(r'[\\/*?"<>|:\n\r\t]', "_", s).strip())[:maxlen]


def crawl_and_save(driver, url: str) -> str:
    slug = url.rstrip("/").split("/")[-1]
    quick = os.path.join(SAVE_DIR, f"{slug}.{FILE_FORMAT}")
    if os.path.exists(quick):
        return f"EXISTS: {slug}"
    try:
        title, md = extract_article(driver, url)
        fname = safe_name(title) + f".{FILE_FORMAT}"
        fpath = os.path.join(SAVE_DIR, fname)
        if os.path.exists(fpath):
            return f"EXISTS: {fname}"
        os.makedirs(SAVE_DIR, exist_ok=True)
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(md)
        time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))
        return f"OK: {fname}"
    except Exception as e:
        return f"ERROR ({url}): {e}"


# ══════════════════════════════════════════════════════════
#  MAIN
# ══════════════════════════════════════════════════════════

def main():
    print("=" * 65)
    print("  Vinmec Bệnh Crawler v4")
    mode_str = f"Search: '{SEARCH_KEYWORD}'" if SEARCH_MODE else f"Danh mục: {DISEASE_LIST_URL}"
    print(f"  Chế độ  : {mode_str}")
    print(f"  Lưu vào : {SAVE_DIR}")
    print(f"  Headless: {HEADLESS}")
    print("=" * 65)

    driver = create_driver()
    try:
        print("\n[1/3] Thu thập link bệnh...\n")
        if SEARCH_MODE:
            all_links = get_links_from_search(driver)
        else:
            all_links = get_links_from_disease_listing(driver)

        print(f"\n  => {len(all_links)} link\n")

        if not all_links:
            print("Không tìm thấy link. Thử:")
            print("  1. Đổi HEADLESS=False để xem browser")
            print("  2. Đổi SEARCH_MODE=False để crawl danh mục /vie/benh/")
            return

        print("=== Danh sách ===")
        for i, l in enumerate(all_links, 1):
            print(f"  {i:3}. {l}")

        ans = input(f"\nCrawl {len(all_links)} bài? (y/n): ").strip().lower()
        if ans != "y":
            return

        print(f"\n[2/3] Crawl...\n")
        os.makedirs(SAVE_DIR, exist_ok=True)
        stats = {}
        for i, url in enumerate(all_links, 1):
            print(f"  [{i:3}/{len(all_links)}] ", end="", flush=True)
            status = crawl_and_save(driver, url)
            print(status)
            key = status.split(":")[0]
            stats[key] = stats.get(key, 0) + 1

    finally:
        driver.quit()

    print("\n" + "=" * 65)
    print("Hoàn thành!")
    for k, v in stats.items():
        if v:
            print(f"  {k:8}: {v}")
    print(f"  Lưu tại : {SAVE_DIR}")
    print("=" * 65)


if __name__ == "__main__":
    main()