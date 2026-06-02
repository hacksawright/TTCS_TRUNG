import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(persist((set) => ({
  token: null, user: null,
  setAuth: (token, user) => set({ token, user }),
  logout: () => set({ token: null, user: null }),
}), { name: 'medtrans-auth' }))

export const useUiStore = create(persist((set, get) => ({
  dark: false,
  direction: 'EN_VI',
  toggleDark: () => { const d = !get().dark; document.documentElement.classList.toggle('dark', d); set({ dark: d }) },
  setDirection: (direction) => set({ direction }),
  applyDarkOnLoad: () => document.documentElement.classList.toggle('dark', get().dark),
}), { name: 'medtrans-ui' }))
