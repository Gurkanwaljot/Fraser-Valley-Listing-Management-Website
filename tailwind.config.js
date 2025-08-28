const defaultTheme = require('tailwindcss/defaultTheme')
const windmill = require('@windmill/react-ui/config')

module.exports = windmill({
   purge: {
    enabled: true, // runs since your build script sets NODE_ENV=production
    content: [
      './public/index.html',
      './src/**/*.{js,jsx,ts,tsx}',
    ],
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        bottom: '0 5px 6px -7px rgba(0, 0, 0, 0.6), 0 2px 4px -5px rgba(0, 0, 0, 0.06)',
      },
    },
  },
})
