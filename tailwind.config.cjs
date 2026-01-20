/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // การใส่ 'sans' ทับแบบนี้จะทำให้ Tailwind ใช้ Phetsarath เป็นฟอนต์หลักของทั้งเว็บ
        sans: ['Phetsarath', 'ui-sans-serif', 'system-ui'],
        phetsarath: ['Phetsarath', 'sans-serif'],
      },
    },
  },
  plugins: [],
}