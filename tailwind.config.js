/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "sans-serif"],
        display: ["Sora", "sans-serif"]
      },
      boxShadow: {
        ambient: "0 28px 90px rgba(15, 23, 42, 0.10)",
        soft: "0 18px 48px rgba(15, 23, 42, 0.08)"
      },
      colors: {
        soil: {
          ink: "#0f172a",
          moss: "#1f5c4e",
          sage: "#7f9b95",
          leaf: "#38a169",
          sand: "#eef2f7",
          clay: "#dbe4ee",
          mist: "#f8fafc"
        }
      }
    }
  },
  plugins: []
};
