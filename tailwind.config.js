// tailwind.config.js
export default {
  mode: 'jit',
  darkMode: 'class', // or 'media' or 'class'
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Scan all JS/TS and JSX/TSX files in src directory
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Roboto Mono', 'monospace'],
      },
      backgroundImage: {
        'noise': "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')",
      },
      dropShadow: {
        'glow': '0 0 8px rgba(255,255,255,0.1)',
        'glow-sm': '0 0 4px rgba(255,255,255,0.05)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        flash: {
          '0%': {
            borderColor: 'rgba(255, 255, 255, 0.2)',
            backgroundColor: 'rgba(239, 68, 68, 0)'
          },
          '50%': {
            borderColor: 'rgba(239, 68, 68, 1)',
            backgroundColor: 'rgba(239, 68, 68, 0.15)'
          },
          '100%': {
            borderColor: 'rgba(255, 255, 255, 0.2)',
            backgroundColor: 'rgba(239, 68, 68, 0)'
          }
        },
        progress: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        }
      },
      animation: {
        flash: 'flash 0.8s ease-in-out',
        progress: 'progress 1.5s ease-in-out infinite',
      },
      borderWidth: {
        'DEFAULT': '1px',
        '30': '30%', // Added for border opacity enhancement
      },
      backgroundColor: {
      }
    },
  },
  variants: {
    extend: {
      scale: ['hover'],
      borderWidth: ['hover', 'focus'],
      dropShadow: ['hover'],
      backdropBlur: ['hover'],
    },
  },
  plugins: [],
}
