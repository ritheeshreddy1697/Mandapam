/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"]
      },
      boxShadow: {
        ambient: "0 28px 90px rgba(15, 23, 42, 0.12)",
        soft: "0 16px 42px rgba(15, 23, 42, 0.08)"
      },
      colors: {
        soil: {
          ink: "#102314",
          moss: "#2f6a41",
          sage: "#7ea174",
          leaf: "#83bf53",
          sand: "#f4efe3",
          clay: "#e7dcc7",
          mist: "#f8fbf4"
        }
      }
    }
  },
  plugins: []
};
