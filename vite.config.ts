import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Project Clockwork',
        short_name: 'Clockwork',
        description: 'A modern web application platform',
        theme_color: '#000000',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/core': path.resolve(__dirname, 'src/core'),
      '@/workers': path.resolve(__dirname, 'src/workers'),
      '@/game': path.resolve(__dirname, 'src/game'),
      '@/systems': path.resolve(__dirname, 'src/systems'),
      '@/ui': path.resolve(__dirname, 'src/ui'),
      '@/assets': path.resolve(__dirname, 'src/assets'),
      '@/types': path.resolve(__dirname, 'src/types')
    }
  },
  server: {
    port: 3000,
    host: true,
    fs: {
      allow: ['..']
    }
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        ai: path.resolve(__dirname, 'src/workers/ai.worker.ts'),
        database: path.resolve(__dirname, 'src/workers/database.worker.ts'),
        network: path.resolve(__dirname, 'src/workers/network.worker.ts'),
        processing: path.resolve(__dirname, 'src/workers/processing.worker.ts')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name?.endsWith('.worker')) {
            return 'workers/[name].[hash].js'
          }
          return 'assets/[name].[hash].js'
        },
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]'
      }
    },
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  worker: {
    format: 'es',
    plugins: []
  },
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __PROD__: JSON.stringify(process.env.NODE_ENV === 'production')
  },
  optimizeDeps: {
    include: ['phaser', 'zustand', 'dexie', 'peerjs', 'immer'],
    exclude: ['@biomejs/biome']
  }
})