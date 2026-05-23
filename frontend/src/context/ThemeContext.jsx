import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const THEMES = {
  // ── Light ──────────────────────────────────
  light: {
    id: 'light', label: 'Classic White', group: 'Light', emoji: '☀️',
    '--bg-primary': '#f8fafc', '--bg-secondary': '#ffffff', '--bg-card': '#ffffff', '--bg-input': '#f1f5f9',
    '--text-primary': '#0f172a', '--text-secondary': '#475569', '--text-muted': '#94a3b8',
    '--border': '#e2e8f0', '--border-strong': '#cbd5e1',
    '--accent': '#1d4ed8', '--accent-light': '#eff6ff', '--accent-text': '#1d4ed8',
    '--shadow': '0 2px 12px rgba(0,0,0,0.08)', '--shadow-card': '0 1px 4px rgba(0,0,0,0.06)',
    '--gradient': 'linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%)',
    '--success': '#16a34a', '--warning': '#b45309', '--danger': '#dc2626',
  },
  'mint': {
    id: 'mint', label: 'Fresh Mint', group: 'Light', emoji: '🌿',
    '--bg-primary': '#f0fdf4', '--bg-secondary': '#ffffff', '--bg-card': '#ffffff', '--bg-input': '#dcfce7',
    '--text-primary': '#052e16', '--text-secondary': '#166534', '--text-muted': '#4ade80',
    '--border': '#bbf7d0', '--border-strong': '#86efac',
    '--accent': '#16a34a', '--accent-light': '#dcfce7', '--accent-text': '#15803d',
    '--shadow': '0 2px 12px rgba(22,163,74,0.10)', '--shadow-card': '0 1px 4px rgba(22,163,74,0.07)',
    '--gradient': 'linear-gradient(135deg,#052e16 0%,#14532d 100%)',
    '--success': '#16a34a', '--warning': '#b45309', '--danger': '#dc2626',
  },
  'lavender': {
    id: 'lavender', label: 'Lavender', group: 'Light', emoji: '💜',
    '--bg-primary': '#faf5ff', '--bg-secondary': '#ffffff', '--bg-card': '#ffffff', '--bg-input': '#f3e8ff',
    '--text-primary': '#2e1065', '--text-secondary': '#6d28d9', '--text-muted': '#a78bfa',
    '--border': '#ddd6fe', '--border-strong': '#c4b5fd',
    '--accent': '#7c3aed', '--accent-light': '#f3e8ff', '--accent-text': '#6d28d9',
    '--shadow': '0 2px 12px rgba(124,58,237,0.10)', '--shadow-card': '0 1px 4px rgba(124,58,237,0.07)',
    '--gradient': 'linear-gradient(135deg,#2e1065 0%,#4c1d95 100%)',
    '--success': '#16a34a', '--warning': '#b45309', '--danger': '#dc2626',
  },
  'sky': {
    id: 'sky', label: 'Sky Blue', group: 'Light', emoji: '🌤️',
    '--bg-primary': '#f0f9ff', '--bg-secondary': '#ffffff', '--bg-card': '#ffffff', '--bg-input': '#e0f2fe',
    '--text-primary': '#0c1a2e', '--text-secondary': '#0369a1', '--text-muted': '#38bdf8',
    '--border': '#bae6fd', '--border-strong': '#7dd3fc',
    '--accent': '#0284c7', '--accent-light': '#e0f2fe', '--accent-text': '#0369a1',
    '--shadow': '0 2px 12px rgba(2,132,199,0.10)', '--shadow-card': '0 1px 4px rgba(2,132,199,0.07)',
    '--gradient': 'linear-gradient(135deg,#0c1a2e 0%,#0c4a6e 100%)',
    '--success': '#16a34a', '--warning': '#b45309', '--danger': '#dc2626',
  },
  'warm-sand': {
    id: 'warm-sand', label: 'Warm Sand', group: 'Light', emoji: '🏜️',
    '--bg-primary': '#fffbeb', '--bg-secondary': '#ffffff', '--bg-card': '#ffffff', '--bg-input': '#fef3c7',
    '--text-primary': '#1c0a00', '--text-secondary': '#92400e', '--text-muted': '#d97706',
    '--border': '#fde68a', '--border-strong': '#fcd34d',
    '--accent': '#d97706', '--accent-light': '#fef3c7', '--accent-text': '#92400e',
    '--shadow': '0 2px 12px rgba(217,119,6,0.10)', '--shadow-card': '0 1px 4px rgba(217,119,6,0.07)',
    '--gradient': 'linear-gradient(135deg,#1c0a00 0%,#78350f 100%)',
    '--success': '#16a34a', '--warning': '#b45309', '--danger': '#dc2626',
  },
  'soft-rose': {
    id: 'soft-rose', label: 'Soft Rose', group: 'Light', emoji: '🌸',
    '--bg-primary': '#fff5f5', '--bg-secondary': '#ffffff', '--bg-card': '#ffffff', '--bg-input': '#fef2f2',
    '--text-primary': '#1a0a0a', '--text-secondary': '#6b3a3a', '--text-muted': '#f87171',
    '--border': '#fecaca', '--border-strong': '#f87171',
    '--accent': '#be123c', '--accent-light': '#fff1f2', '--accent-text': '#be123c',
    '--shadow': '0 2px 12px rgba(190,18,60,0.08)', '--shadow-card': '0 1px 4px rgba(190,18,60,0.05)',
    '--gradient': 'linear-gradient(135deg,#1a0a0a 0%,#7f1d1d 100%)',
    '--success': '#16a34a', '--warning': '#b45309', '--danger': '#dc2626',
  },
  // ── Dark ───────────────────────────────────
  dark: {
    id: 'dark', label: 'Midnight Dark', group: 'Dark', emoji: '🌙',
    '--bg-primary': '#0f172a', '--bg-secondary': '#1e293b', '--bg-card': '#1e293b', '--bg-input': '#334155',
    '--text-primary': '#f1f5f9', '--text-secondary': '#94a3b8', '--text-muted': '#64748b',
    '--border': '#334155', '--border-strong': '#475569',
    '--accent': '#3b82f6', '--accent-light': '#1e3a5f', '--accent-text': '#60a5fa',
    '--shadow': '0 2px 16px rgba(0,0,0,0.4)', '--shadow-card': '0 1px 6px rgba(0,0,0,0.3)',
    '--gradient': 'linear-gradient(135deg,#020617 0%,#0f2a5e 100%)',
    '--success': '#22c55e', '--warning': '#fbbf24', '--danger': '#f87171',
  },
  'deep-blue': {
    id: 'deep-blue', label: 'Deep Blue', group: 'Dark', emoji: '🔵',
    '--bg-primary': '#030d1f', '--bg-secondary': '#071630', '--bg-card': '#0d2244', '--bg-input': '#0d2244',
    '--text-primary': '#e0eeff', '--text-secondary': '#7db5ff', '--text-muted': '#4d7ab5',
    '--border': '#0d2855', '--border-strong': '#1a4080',
    '--accent': '#3b82f6', '--accent-light': '#0a2040', '--accent-text': '#60a5fa',
    '--shadow': '0 2px 20px rgba(0,50,150,0.3)', '--shadow-card': '0 1px 8px rgba(0,40,120,0.25)',
    '--gradient': 'linear-gradient(135deg,#020a1a 0%,#0a2a6e 100%)',
    '--success': '#34d399', '--warning': '#fbbf24', '--danger': '#f87171',
  },
  'forest-dark': {
    id: 'forest-dark', label: 'Forest Dark', group: 'Dark', emoji: '🌲',
    '--bg-primary': '#0a1a0e', '--bg-secondary': '#132517', '--bg-card': '#1a3020', '--bg-input': '#1a3020',
    '--text-primary': '#e8f5ea', '--text-secondary': '#86c98e', '--text-muted': '#4d8557',
    '--border': '#1c3d22', '--border-strong': '#2d6634',
    '--accent': '#22c55e', '--accent-light': '#0f2d14', '--accent-text': '#4ade80',
    '--shadow': '0 2px 16px rgba(0,60,20,0.4)', '--shadow-card': '0 1px 6px rgba(0,40,15,0.3)',
    '--gradient': 'linear-gradient(135deg,#040e06 0%,#0d3017 100%)',
    '--success': '#4ade80', '--warning': '#fbbf24', '--danger': '#f87171',
  },
  // ── Contrast ──────────────────────────────
  contrast: {
    id: 'contrast', label: 'High Contrast', group: 'Contrast', emoji: '⚡',
    '--bg-primary': '#000000', '--bg-secondary': '#111111', '--bg-card': '#111111', '--bg-input': '#1a1a1a',
    '--text-primary': '#ffffff', '--text-secondary': '#e5e5e5', '--text-muted': '#aaaaaa',
    '--border': '#333333', '--border-strong': '#555555',
    '--accent': '#facc15', '--accent-light': '#1a1500', '--accent-text': '#facc15',
    '--shadow': '0 2px 12px rgba(0,0,0,0.7)', '--shadow-card': '0 1px 4px rgba(0,0,0,0.6)',
    '--gradient': 'linear-gradient(135deg,#000 0%,#1a1200 100%)',
    '--success': '#4ade80', '--warning': '#facc15', '--danger': '#f87171',
  },
}

function applyTheme(theme) {
  const root = document.documentElement
  // Set CSS custom properties
  Object.entries(theme).forEach(([key, value]) => {
    if (key.startsWith('--')) root.style.setProperty(key, value)
  })
  // Set data-theme for CSS selectors
  root.setAttribute('data-theme', theme.id)
  // Set body directly so it responds immediately
  document.body.style.setProperty('background', theme['--bg-primary'])
  document.body.style.setProperty('color', theme['--text-primary'])
}

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => localStorage.getItem('mr-theme') || 'light')

  const theme = THEMES[themeId] || THEMES.light

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem('mr-theme', themeId)
  }, [themeId, theme])

  // Apply on first mount too (covers page refresh)
  useEffect(() => {
    applyTheme(THEMES[localStorage.getItem('mr-theme') || 'light'] || THEMES.light)
  }, [])

  return (
    <ThemeContext.Provider value={{ themeId, setThemeId, theme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
