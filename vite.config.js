import { defineConfig } from 'vite'
import { resolve } from 'path'

const cleanRouteFiles = {
  'restaurants.html': 'Restaurants/index.html',
  'coaches.html': 'Coaches/index.html',
  'careers.html': 'Careers/index.html'
}

function cleanRoutes() {
  const rewriteRequest = (request) => {
    const [pathname, search = ''] = request.url.split('?')
    const routeFile = {
      '/Restaurants/': '/restaurants.html',
      '/Coaches/': '/coaches.html',
      '/Careers/': '/careers.html'
    }[pathname]

    if (routeFile) request.url = `${routeFile}${search ? `?${search}` : ''}`
  }

  return {
    name: 'clean-routes',
    enforce: 'post',
    generateBundle: {
      order: 'post',
      handler(_, bundle) {
        for (const [from, to] of Object.entries(cleanRouteFiles)) {
          const page = bundle[from]
          if (!page) continue

          delete bundle[from]
          page.fileName = to
          bundle[to] = page
        }
      }
    },
    configureServer(server) {
      server.middlewares.use((request, _, next) => {
        rewriteRequest(request)
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((request, _, next) => {
        rewriteRequest(request)
        next()
      })
    }
  }
}

export default defineConfig({
  base: '/',
  plugins: [cleanRoutes()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        restaurants: resolve(__dirname, 'restaurants.html'),
        coaches: resolve(__dirname, 'coaches.html'),
        careers: resolve(__dirname, 'careers.html'),
        unsubscribe: resolve(__dirname, 'unsubscribe.html'),
        onboarding: resolve(__dirname, 'onboarding.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        nathaniel: resolve(__dirname, 'nathaniel/index.html'),
        rishu: resolve(__dirname, 'rishu/index.html'),
        monish: resolve(__dirname, 'monish/index.html')
      }
    }
  }
})
