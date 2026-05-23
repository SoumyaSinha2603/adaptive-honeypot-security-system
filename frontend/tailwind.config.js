/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        hdfc: {
          red:    '#E31837',
          blue:   '#003366',
          ltblue: '#004080',
          navy:   '#002244',
          gold:   '#C8A84B',
        }
      }
    }
  },
  plugins: []
}
