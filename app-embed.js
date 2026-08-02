// Preloads the UPlate app (app.u-plate.com, a Flutter web build) in a hidden
// iframe while the visitor browses the marketing site, then reveals that same
// iframe in place of navigating to onboarding.html — so "Get started" opens
// an app that's already booted instead of paying cold-load cost on click.
// Iframe embedding follows https://docs.flutter.dev/platform-integration/web/embedding-flutter-web#iframe-embedding

const APP_URL = 'https://app.u-plate.com'
const ONBOARDING_LINK_SELECTOR = 'a[href*="onboarding.html"]'
// The app bundle is multi-megabyte; starting it too soon steals bandwidth from
// the landing page's own images and keeps the tab spinner running, which reads
// as "the site is still loading". Hold off until the page has settled.
const PRELOAD_DELAY_MS = 3000

let backdrop = null
let frame = null

function createFrame() {
    if (frame) return frame
    backdrop = document.createElement('div')
    backdrop.className = 'uplate-app-backdrop'
    backdrop.setAttribute('aria-hidden', 'true')

    frame = document.createElement('iframe')
    frame.src = APP_URL
    frame.className = 'uplate-app-frame'
    frame.title = 'UPlate'
    frame.setAttribute('tabindex', '-1')
    frame.allow = 'camera; microphone; geolocation'

    backdrop.appendChild(frame)
    document.body.appendChild(backdrop)
    return frame
}

function showApp() {
    createFrame()
    backdrop.removeAttribute('aria-hidden')
    frame.removeAttribute('tabindex')
    backdrop.classList.add('is-visible')
    document.documentElement.classList.add('uplate-app-open')
}

function hideApp() {
    if (backdrop) {
        backdrop.setAttribute('aria-hidden', 'true')
        frame.setAttribute('tabindex', '-1')
        backdrop.classList.remove('is-visible')
    }
    document.documentElement.classList.remove('uplate-app-open')
}

// Preloading is an optimization, never a requirement — on metered or slow
// connections the cost outweighs the head start, so we wait for real intent.
function shouldAutoPreload() {
    const connection = navigator.connection
    if (!connection) return true
    if (connection.saveData) return false
    return !/2g/.test(connection.effectiveType || '')
}

function preload() {
    if (!shouldAutoPreload()) return
    setTimeout(() => {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(createFrame, { timeout: 2000 })
        } else {
            createFrame()
        }
    }, PRELOAD_DELAY_MS)
}

function bindOnboardingLinks() {
    document.querySelectorAll(ONBOARDING_LINK_SELECTOR).forEach((link) => {
        // Hovering or touching "Get started" is the strongest signal we get
        // that the app is about to be needed — warm it then regardless of the
        // scheduled preload, so the click still lands on a booted app.
        const warm = () => createFrame()
        link.addEventListener('pointerenter', warm, { once: true })
        link.addEventListener('touchstart', warm, { once: true, passive: true })
        link.addEventListener('focus', warm, { once: true })

        link.addEventListener('click', (event) => {
            event.preventDefault()
            showApp()
            const target = link.getAttribute('href').replace(/^\./, '')
            if (location.pathname + location.search !== target) {
                history.pushState({ uplateApp: true }, '', target)
            }
        })
    })
}

window.addEventListener('popstate', (event) => {
    if (!(event.state && event.state.uplateApp)) hideApp()
})

if (document.readyState === 'complete') {
    preload()
} else {
    window.addEventListener('load', preload)
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindOnboardingLinks)
} else {
    bindOnboardingLinks()
}
