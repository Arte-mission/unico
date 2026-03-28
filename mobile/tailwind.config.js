/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#0B0F1A',
        surface: '#161B2A',
        surfaceLight: '#23293D',
        accent: '#6366F1',
        accentLight: '#818CF8',
        accentDark: '#4F46E5',
        success: '#10B981',
        danger: '#F43F5E',
        textPrimary: '#F8FAFC',
        textSecondary: '#94A3B8',
        textTertiary: '#64748B',
        border: '#1E293B',
      },
      borderRadius: {
        '4xl': '32px',
        '5xl': '40px',
      },
    },
  },
  plugins: [],
}
