import { useUiStore } from '../store/auth'

export default function Header({ onMenu }) {
  const { dark, toggleDark, direction, setDirection } = useUiStore()
  return (
    <header className="h-14 px-4 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
      <button className="md:hidden p-2" onClick={onMenu} aria-label="Menu">☰</button>
      <h1 className="font-semibold">MedTrans</h1>
      <div className="ml-auto flex items-center gap-2">
        <select value={direction} onChange={e=>setDirection(e.target.value)}
          className="text-sm px-3 py-1.5 rounded-lg border bg-transparent dark:border-slate-700">
          <option value="EN_VI">English → Vietnamese</option>
          <option value="VI_EN">Vietnamese → English</option>
        </select>
        <button onClick={toggleDark} className="p-2 rounded-lg border dark:border-slate-700" aria-label="Toggle theme">
          {dark ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  )
}
