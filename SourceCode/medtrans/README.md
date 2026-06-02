# MedTrans — Medical Translator (EN ↔ VI)

Full-stack reference project:

- **Frontend**: React 18 + Vite + TailwindCSS + Zustand + Axios + React Router
- **Backend**: Spring Boot 3 + Spring Security (JWT) + JPA + MySQL
- **AI Server**: FastAPI (external) — `POST /predict`
- **DB**: MySQL 8

## Architecture / Flow

```
[React (Vite)]  --JWT-->  [Spring Boot REST]  --HTTP-->  [FastAPI /predict]
       |                          |
       |                          +--JPA--> [MySQL]
       |
       +--Axios with Bearer token
```

1. User logs in → Spring Boot returns JWT.
2. FE saves JWT in Zustand + localStorage; attaches `Authorization: Bearer <token>` to every request via Axios interceptor.
3. User sends text → FE calls `POST /api/messages/translate` on Spring Boot.
4. Spring Boot:
   - validates JWT,
   - persists USER message,
   - calls FastAPI `POST /predict` via `WebClient`,
   - persists AI message with `latency_ms`,
   - returns the AI message DTO.
5. Conversation history is loaded from `GET /api/conversations` and `GET /api/conversations/{id}/messages`.

## Quick start

### 1) Database
```bash
mysql -u root -p < database/schema.sql
```

### 2) Backend
```bash
cd backend
# edit src/main/resources/application.yml (DB creds, FASTAPI_URL, JWT secret)
./mvnw spring-boot:run
```
Swagger: http://localhost:8080/swagger-ui/index.html

### 3) Frontend
```bash
cd frontend
cp .env.example .env   # set VITE_API_URL=http://localhost:8080
npm install
npm run dev
```
Open http://localhost:5173

### 4) FastAPI
The FastAPI service is external. Set `FASTAPI_URL` in `application.yml`:
```yaml
ai:
  base-url: https://your-fastapi-host.example.com
  timeout-ms: 30000
```

## API summary

| Method | Path | Auth | Body |
|---|---|---|---|
| POST | /api/auth/register | no | {username,email,password} |
| POST | /api/auth/login | no | {email,password} → {token} |
| GET  | /api/conversations | yes | — |
| POST | /api/conversations | yes | {title} |
| DELETE | /api/conversations/{id} | yes | — |
| GET  | /api/conversations/{id}/messages | yes | — |
| POST | /api/messages/translate | yes | {conversationId, text, direction} |

## Notes
- CORS is open for `http://localhost:5173` in dev; tighten for prod.
- Replace `JWT_SECRET` with a long random value.
- `direction` is `EN_VI` or `VI_EN` (forwarded as a hint; FastAPI currently only takes `text`).
