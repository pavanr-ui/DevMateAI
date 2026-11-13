import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useThemeStore } from '@/stores/theme'

describe('theme store', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    setActivePinia(createPinia())
  })

  it('defaults to system mode', () => {
    expect(useThemeStore().mode).toBe('system')
  })

  it('toggles dark mode and adds the Ionic dark class to <html>', () => {
    const theme = useThemeStore()
    theme.setMode('light')
    theme.toggle()

    expect(theme.mode).toBe('dark')
    expect(theme.isDark).toBe(true)
    expect(document.documentElement.classList.contains('ion-palette-dark')).toBe(true)
  })

  it('remembers the choice in localStorage', () => {
    useThemeStore().setMode('dark')
    setActivePinia(createPinia())
    expect(useThemeStore().mode).toBe('dark')
  })

  it('ignores invalid modes', () => {
    const theme = useThemeStore()
    theme.setMode('purple')
    expect(theme.mode).toBe('system')
  })
})
