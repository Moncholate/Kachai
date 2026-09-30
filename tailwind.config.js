/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      keyframes: {
        rise: {
          from: { transform: 'translateY(40px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        champion: {
          '0%': { transform: 'scale(.3)', opacity: '0' },
          '60%': { transform: 'scale(1.15)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 24px 4px rgba(250, 204, 21, .45)' },
          '50%': { boxShadow: '0 0 48px 14px rgba(250, 204, 21, .75)' },
        },
      },
      animation: {
        rise: 'rise .6s cubic-bezier(.2,.9,.3,1.2) both',
        champion: 'champion .9s cubic-bezier(.2,.9,.3,1.2) both',
        glow: 'glow 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
