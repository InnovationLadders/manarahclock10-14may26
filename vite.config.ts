import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import svgr from 'vite-plugin-svgr';
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  publicDir: 'public',
  build: {
    copyPublicDir: false,
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
      }
    }
  },
  plugins: [
    {
      name: 'copy-public-selective',
      async closeBundle() {
        const publicDir = resolve(process.cwd(), 'public');
        const distDir = resolve(process.cwd(), 'dist');

        const allowedFiles = [
          '_redirects',
          'robots.txt',
          'sitemap.xml',
          'manifest.json',
          'manarah1.png',
          'apple-touch-icon.png',
          'favicon.ico',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'logo_MANARAH_25.svg'
        ];

        for (const file of allowedFiles) {
          const src = join(publicDir, file);
          const dest = join(distDir, file);
          try {
            if (existsSync(src)) {
              copyFileSync(src, dest);
            }
          } catch (e) {
            console.warn(`Could not copy ${file}:`, e);
          }
        }

        // نسخ مجلد الخلفيات المحلية
        const bgSrc = join(publicDir, 'backgrounds');
        const bgDest = join(distDir, 'backgrounds');
        if (existsSync(bgSrc)) {
          try {
            mkdirSync(bgDest, { recursive: true });
            for (const file of readdirSync(bgSrc)) {
              copyFileSync(join(bgSrc, file), join(bgDest, file));
            }
          } catch (e) {
            console.warn('Could not copy backgrounds folder:', e);
          }
        }
      }
    },
    react(),
    svgr(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'ساعة منارة - ساعة المسجد الذكية لأوقات الصلاة',
        short_name: 'ساعة منارة',
        description: 'ساعة منارة - ساعة المسجد الذكية والتلفزيونية لعرض أوقات الصلاة والأذان بدقة عالية. نظام متطور لإدارة شاشات المساجد مع عرض الأدعية والإعلانات.',
        theme_color: '#059669',
        background_color: '#0f2027',
        display: 'fullscreen',
        display_override: ['fullscreen', 'standalone', 'minimal-ui'],
        orientation: 'any',
        lang: 'ar',
        dir: 'rtl',
        start_url: '/tv',
        prefer_related_applications: false,
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
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,woff2}', '*.{png,svg,jpg,jpeg}'],
        globIgnores: ['backgrounds/**'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          },
          {
            // خلفيات Firebase Storage المرفوعة من المساجد — تُخزن للعمل أوف لاين
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*\/backgrounds\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'mosque-backgrounds-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          },
          {
            // الخلفيات المحلية — تُخزن عند أول استخدام ولا تُحمَّل مسبقاً
            urlPattern: /\/backgrounds\/.+\.(jpg|jpeg|png|webp)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'local-backgrounds-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 60
              }
            }
          }
        ]
      }
    }
    )
  ],
  server: {
    port: 5173,
    host: true
  },
  optimizeDeps: {
    exclude: ['lucide-react']
  }
});