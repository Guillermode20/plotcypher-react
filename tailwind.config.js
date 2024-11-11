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
  plugins: [
  ],
  // Add component classes
  layer: {
    components: {
      '.plotcypher-white-btn': {
        '@apply w-full sm:w-auto px-6 py-2': {},
        '@apply text-white/90 tracking-[0.2em]': {},
        '@apply border border-white/30 rounded-md': {},
        '@apply bg-zinc-950': {},
        '@apply hover:bg-zinc-950 hover:border-white/30': {},
        '@apply focus:outline-none focus:border-white/40': {},
        '@apply focus:ring-2 focus:ring-white/20': {},
        '@apply transition-all duration-300': {},
      },
      '.plotcypher-red-btn': {
        '@apply w-full sm:w-auto px-6 py-2': {},
        '@apply text-red-500/90 tracking-[0.2em]': {},
        '@apply border border-red-500/30 rounded-md': {},
        '@apply bg-zinc-950': {},
        '@apply hover:bg-zinc-950 hover:border-white/30': {},
        '@apply focus:outline-none focus:border-white/40': {},
        '@apply focus:ring-2 focus:ring-white/20': {},
        '@apply transition-all duration-300': {},
        '@apply disabled:opacity-50': {},
      },
    },
  },
}
