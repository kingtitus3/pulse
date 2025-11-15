import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Tahoma', 'Verdana', 'system-ui', 'sans-serif'],
      },
      colors: {
        yahoo: {
          bg: '#F0F0F0',
          sidebar: '#FFFFFF',
          chatBg: '#FFFFFF',
          border: '#CCCCCC',
          borderDark: '#999999',
          header: '#0066CC',
          headerText: '#FFFFFF',
          text: '#000000',
          textMuted: '#666666',
          link: '#0066CC',
          linkHover: '#003366',
          inputBg: '#FFFFFF',
          inputBorder: '#CCCCCC',
          button: '#0066CC',
          buttonHover: '#0052A3',
          buttonText: '#FFFFFF',
          messageEven: '#FFFFFF',
          messageOdd: '#F9F9F9',
          messageHover: '#F0F0F0',
          online: '#00CC00',
          offline: '#CCCCCC',
        },
      },
    },
  },
  plugins: [],
}
export default config

