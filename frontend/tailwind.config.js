export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#14181c',
        surface2: '#1b2228',
        surface3: '#222c35',
        text: '#c9d1d9',
        muted: '#8f98a3',
        accentRed: '#ff6c4b',
        accentGreen: '#5dd18f',
        accentBlue: '#5f9dff',
        accentGold: '#f7c549'
      },
      boxShadow: {
        subtle: '0 1px 0 rgba(255,255,255,0.04)'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      letterSpacing: {
        wider: '0.18em'
      }
    }
  },
  plugins: []
};
