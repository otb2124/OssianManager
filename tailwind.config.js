export default {
  corePlugins: {
    preflight: false,
  },
  safelist: [
    'border-theme',
    'bg-theme',
    'text-theme',
    'bg-theme-muted',
    'border-theme-border',
    'bg-theme-glow',
  ],
  theme: {
    extend: {
      colors: {
        theme: 'var(--theme-color)',
        'theme-muted': 'var(--theme-color-muted)',
        'theme-border': 'var(--theme-color-border)',
        'theme-glow': 'var(--theme-color-glow)',
      }
    }
  }
}