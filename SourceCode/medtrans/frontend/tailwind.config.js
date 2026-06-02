/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: { 50:'#eef7ff',100:'#d9ecff',500:'#1a8fff',600:'#0a73e6',700:'#0859b4' }
      },
      boxShadow: { soft: '0 4px 24px -8px rgba(10,115,230,.18)' }
    }
  },
  plugins: []
}
