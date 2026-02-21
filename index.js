// Vite bundling imports 
import './css/tailwind.css'
import './css/index.css'

// Wrap everything in init function to ensure DOM is ready
function init() {

const RESPONSIVE_WIDTH = 1024

let headerWhiteBg = false
let isHeaderCollapsed = window.innerWidth < RESPONSIVE_WIDTH
const collapseBtn = document.getElementById("collapse-btn")
const collapseHeaderItems = document.getElementById("collapsed-header-items")

// Typewriter effect 
const introScreen = document.getElementById("intro-screen")
const mainSite = document.getElementById("main-site")
const enterBtn = document.getElementById("enter-btn")
const typewriterText = document.getElementById("typewriter-text")

const phrases = [
    "BETTER FOOD.",
    "BETTER TRACKING.",
    "BETTER HEALTH."
]

let currentPhraseIndex = 0
let currentCharIndex = 0
let isDeleting = false
let typingSpeed = 80

function typeWriter() {
    const currentPhrase = phrases[currentPhraseIndex]
    
    if (!isDeleting) {
        // Typing
        typewriterText.textContent = currentPhrase.substring(0, currentCharIndex + 1)
        currentCharIndex++
        
        if (currentCharIndex === currentPhrase.length) {
            // Finished typing current phrase
            if (currentPhraseIndex < phrases.length - 1) {
                // Pause before deleting
                setTimeout(() => {
                    isDeleting = true
                    typeWriter()
                }, 800)
            }
            // If last phrase, just keep it displayed
            return
        }
    } else {
        // Deleting - but keep "BETTER " (7 characters)
        if (currentCharIndex > 7) {
            currentCharIndex--
            typewriterText.textContent = currentPhrase.substring(0, currentCharIndex)
        } else {
            // Reached "BETTER ", move to next phrase
            isDeleting = false
            currentPhraseIndex++
            currentCharIndex = 7 // Start after "BETTER "
            setTimeout(typeWriter, 300)
            return
        }
    }
    
    const speed = isDeleting ? typingSpeed / 2 : typingSpeed
    setTimeout(typeWriter, speed)
}

function enterSite() {
    introScreen.classList.add("hidden")
    mainSite.classList.add("visible")
    document.body.style.overflow = "auto"
    // Mark that user has seen the intro this session
    sessionStorage.setItem("introSeen", "true")
}

// ============ REFERRAL SYSTEM ============
const referralModal = document.getElementById("referral-modal")
const referralForm = document.getElementById("referral-form")
const referrerNameSpan = document.getElementById("referrer-name")
const referralFullnameInput = document.getElementById("referral-fullname")
const referralBtnIcon = document.getElementById("referral-btn-icon")
const referralBtnText = document.getElementById("referral-btn-text")

// Detect if user is on Android
function isAndroid() {
    const ua = navigator.userAgent || navigator.vendor || window.opera
    return /android/i.test(ua)
}

// App store URLs
const APP_STORE_IOS = 'https://apps.apple.com/us/app/uplate/id6752828206'
const APP_STORE_ANDROID = 'https://play.google.com/store/apps/details?id=com.njr.boilerFuel' 

// API endpoint for referral tracking
const REFERRAL_API = 'https://boilerbites.com/purdue/referrals/createAttempt'

// Check for referral code in URL params
// Supports: ?ref=CODE&handle=IG_HANDLE or path like /ref/CODE (from Porkbun wildcard redirect)
function getReferralCode() {
    const urlParams = new URLSearchParams(window.location.search)
    
    // Check query param: ?ref=CODE
    if (urlParams.has('ref')) {
        return urlParams.get('ref')
    }
    
    // Check path: /ref/CODE or just the last segment if redirected
    const pathParts = window.location.pathname.split('/').filter(Boolean)
    if (pathParts.length > 0 && pathParts[0] === 'ref' && pathParts[1]) {
        return pathParts[1]
    }
    
    return null
}

// Get referrer's Instagram handle from URL params
function getReferrerHandle() {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('handle') || ''
}

// Format referral code for display (e.g., "john_doe" → "John Doe")
function formatReferrerName(code) {
    if (!code) return ''
    return code
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
}

function showReferralModal(referralCode) {
    // Hide intro screen immediately
    if (introScreen) {
        introScreen.classList.add("hidden")
    }
    
    // Show main site behind modal
    if (mainSite) {
        mainSite.classList.add("visible")
    }
    
    // Set referrer name
    referrerNameSpan.textContent = formatReferrerName(referralCode)
    
    // Update button for Android vs iOS
    if (isAndroid()) {
        if (referralBtnIcon) {
            referralBtnIcon.classList.remove('bi-apple')
            referralBtnIcon.classList.add('bi-google-play')
        }
        if (referralBtnText) {
            referralBtnText.textContent = 'Download for Android'
        }
    }
    
    // Show modal
    referralModal.classList.remove("tw-hidden")
    document.body.style.overflow = "hidden"
    
    // Focus input
    setTimeout(() => referralFullnameInput.focus(), 400)
}

async function handleReferralSubmit(e) {
    e.preventDefault()
    
    const fullName = referralFullnameInput.value.trim()
    if (!fullName) return
    
    const referralCode = getReferralCode()
    const referrerHandle = getReferrerHandle()
    const referrerName = formatReferrerName(referralCode)
    
    // Disable button while processing
    const submitBtn = document.getElementById('referral-submit')
    const originalBtnText = referralBtnText.textContent
    submitBtn.disabled = true
    referralBtnText.textContent = 'Processing...'
    
    try {
        // Call the referral API to record this attempt
        const apiUrl = `${REFERRAL_API}?name=${encodeURIComponent(fullName)}&referredBy=${encodeURIComponent(referrerName)}&referrerHandle=${encodeURIComponent(referrerHandle)}`
        
        const response = await fetch(apiUrl, {
            method: 'GET', // or 'POST' if the API expects that
            mode: 'cors'
        })
        
        if (!response.ok) {
            console.warn('Referral API returned non-OK status:', response.status)
            // Continue anyway - don't block the user from downloading
        }
        
    } catch (error) {
        // Log error but don't block the user
        console.error('Referral API error:', error)
    }
    
    // Store referral data in localStorage as backup
    const referralData = {
        referralCode: referralCode,
        referrerHandle: referrerHandle,
        referredUserName: fullName,
        timestamp: new Date().toISOString(),
        source: window.location.href,
        platform: isAndroid() ? 'android' : 'ios'
    }
    localStorage.setItem('uplate_referral', JSON.stringify(referralData))
    sessionStorage.setItem('uplate_referral', JSON.stringify(referralData))
    
    // Mark intro as seen
    sessionStorage.setItem("introSeen", "true")
    
    // Redirect to appropriate App Store
    window.location.href = isAndroid() ? APP_STORE_ANDROID : APP_STORE_IOS
}

// Initialize referral system
const referralCode = getReferralCode()

if (referralCode && referralModal) {
    // User came from a referral link - show the modal
    showReferralModal(referralCode)
    
    // Handle form submission
    referralForm.addEventListener('submit', handleReferralSubmit)
} else if (introScreen && typewriterText) {
    // Normal flow - check for intro
    const hasSeenIntro = sessionStorage.getItem("introSeen")
    
    if (hasSeenIntro) {
        // Skip intro, go straight to main site
        introScreen.classList.add("hidden")
        mainSite.classList.add("visible")
        document.body.style.overflow = "auto"
    } else {
        // Show intro on first visit
        document.body.style.overflow = "hidden"
        // Start typewriter after a brief delay
        setTimeout(typeWriter, 500)

        // Enter button click
        if (enterBtn) {
            enterBtn.addEventListener("click", enterSite)
        }

        // Also allow clicking anywhere on intro after animation completes post delay 
        setTimeout(() => {
            introScreen.addEventListener("click", (e) => {
                if (e.target === introScreen || e.target.closest(".intro-content")) {
                    enterSite()
                }
            })
        }, 3000)
    }
}



// Header
function onHeaderClickOutside(e) {
    if (!collapseHeaderItems.contains(e.target)) {
        toggleHeader()
    }
}

function toggleHeader() {
    if (isHeaderCollapsed) {
        collapseHeaderItems.classList.add("opacity-100")
        collapseHeaderItems.style.width = "280px"
        collapseBtn.classList.remove("bi-list")
        collapseBtn.classList.add("bi-x")
        isHeaderCollapsed = false
        setTimeout(() => window.addEventListener("click", onHeaderClickOutside), 1)
    } else {
        collapseHeaderItems.classList.remove("opacity-100")
        collapseHeaderItems.style.width = "0px"
        collapseBtn.classList.remove("bi-x")
        collapseBtn.classList.add("bi-list")
        isHeaderCollapsed = true
        window.removeEventListener("click", onHeaderClickOutside)
    }
}

function responsive() {
    if (window.innerWidth > RESPONSIVE_WIDTH) {
        collapseHeaderItems.style.width = ""

    } else {
        isHeaderCollapsed = true
    }
}

window.addEventListener("resize", responsive)


/**
 * Animations
 */

gsap.registerPlugin(ScrollTrigger)


gsap.to(".reveal-up", {
    opacity: 0,
    y: "100%",
})

// gsap.to("#dashboard", {
//     boxShadow: "0px 15px 25px -5px #7e22ceaa",
//     duration: 0.3,
//     scrollTrigger: {
//         trigger: "#hero-section",
//         start: "60% 60%",
//         end: "80% 80%",
//         // markers: true
//     }

// })

// straightens the slanting image
gsap.to("#dashboard", {
    scale: 1,
    translateY: 0,
    rotateX: "0deg",
    scrollTrigger: {
        trigger: "#hero-section",
        start: "top 80%",
        end: "60% center",
        scrub: 1,
    }
})

const faqAccordion = document.querySelectorAll('.faq-accordion')

faqAccordion.forEach(function (btn) {
    btn.addEventListener('click', function () {
        this.classList.toggle('active')

        // Toggle 'rotate' class to rotate the arrow
        let content = this.nextElementSibling
        
        // content.classList.toggle('!tw-hidden')
        if (content.style.maxHeight === '200px') {
            content.style.maxHeight = '0px'
            content.style.padding = '0px 18px'

        } else {
            content.style.maxHeight = '200px'
            content.style.padding = '20px 18px'
        }
    })
})



// Section reveal animations

const sections = gsap.utils.toArray("section")

sections.forEach((sec) => {

    const revealUptimeline = gsap.timeline({paused: true, 
                                            scrollTrigger: {
                                                            trigger: sec,
                                                            start: "10% 80%", // top of trigger hits the top of viewport
                                                            end: "20% 90%",
                                                            // markers: true,
                                                            // scrub: 1,
                                                        }})

    revealUptimeline.to(sec.querySelectorAll(".reveal-up"), {
        opacity: 1,
        duration: 0.8,
        y: "0%",
        stagger: 0.2,
    })


})


// Scroll highlight and phone carousel sync 

const featureItems = document.querySelectorAll('.feature-item')
const phoneCarousel = document.getElementById('phone-carousel')
const phoneItems = document.querySelectorAll('.phone-carousel-item')
const featuresSection = document.getElementById('features')

let currentActiveFeature = -1
const totalFeatures = 5
const anglePerItem = 360 / totalFeatures // 72 degrees between each phone

// Y-axis rotation
function initCarousel() {
    phoneItems.forEach((item, index) => {
        const angle = index * anglePerItem
        // translateZ pushes the phone outward from center
        item.style.transform = `rotateY(${angle}deg) translateZ(200px)`
        if (index === 0) {
            item.classList.add('active')
        } else {
            item.classList.add('behind')
        }
    })
}

// Rotate carousel to show the phone at given index
function rotateCarouselTo(index) {
    const rotation = -index * anglePerItem
    phoneCarousel.style.transform = `rotateY(${rotation}deg)`
    
    // Update active/behind states
    phoneItems.forEach((item, i) => {
        if (i === index) {
            item.classList.remove('behind')
            item.classList.add('active')
        } else {
            item.classList.remove('active')
            item.classList.add('behind')
        }
    })
}

function updateActiveFeature() {
    const scrollContainer = document.getElementById('features-scroll-container')
    if (!scrollContainer) return
    
    const containerRect = scrollContainer.getBoundingClientRect()
    const containerTop = containerRect.top
    const containerHeight = containerRect.height
    const viewportHeight = window.innerHeight
    
    // Calculate scroll progress through the container (0 to 1)
    const scrollableDistance = containerHeight - viewportHeight
    const scrollProgress = Math.max(0, Math.min(1, -containerTop / scrollableDistance))
    
    // Determine which feature to show based on scroll progress
    const activeIndex = Math.min(Math.floor(scrollProgress * totalFeatures), totalFeatures - 1)
    
    // Only update if the index actually changed
    if (activeIndex !== currentActiveFeature) {
        currentActiveFeature = activeIndex
        
        // Update feature items - only show the active one
        featureItems.forEach((item, index) => {
            if (index === activeIndex) {
                item.classList.add('active')
            } else {
                item.classList.remove('active')
            }
        })
        
        // Rotate the phone carousel with smooth animation
        rotateCarouselTo(activeIndex)
    }
}

// Initialize carousel on load
if (phoneItems.length > 0) {
    initCarousel()
}

// Listen to scroll events
window.addEventListener('scroll', updateActiveFeature)
window.addEventListener('resize', updateActiveFeature)

// Initial check after a small delay to let layout settle
setTimeout(updateActiveFeature, 100)

// Export toggleHeader to global scope for HTML onclick
window.toggleHeader = toggleHeader

// ============ UNIVERSITY SEARCH ============
const uniSearchInput = document.getElementById('uni-search-input')
const uniSearchResults = document.getElementById('uni-search-results')
const downloadButtons = document.getElementById('download-buttons')
const waitlistPanel = document.getElementById('waitlist-panel')
const waitlistForm = document.getElementById('waitlist-form')
const waitlistUniName = document.getElementById('waitlist-uni-name')
const waitlistEmail = document.getElementById('waitlist-email')
const waitlistSuccess = document.getElementById('waitlist-success')

let uniDebounceTimer = null

// Check if input matches Purdue (case/whitespace/special-char insensitive)
function isPurdue(name) {
    const normalized = name.replace(/[^a-zA-Z]/g, '').toLowerCase()
    return normalized === 'purdue' || normalized.startsWith('purdue')
}

// Hide all reveal panels (download buttons & waitlist)
function hideAllPanels() {
    document.querySelectorAll('.hero-reveal-panel').forEach(panel => {
        panel.style.maxHeight = '0'
        panel.style.overflow = 'hidden'
        panel.classList.remove('tw-opacity-100', 'tw-translate-y-0')
        panel.classList.add('tw-opacity-0', 'tw-translate-y-4', 'tw-pointer-events-none')
    })
}

// Animate a panel into view
function showPanel(panel) {
    panel.style.maxHeight = '300px'
    panel.style.overflow = 'visible'
    panel.classList.remove('tw-opacity-0', 'tw-translate-y-4', 'tw-pointer-events-none')
    panel.classList.add('tw-opacity-100', 'tw-translate-y-0')
}

function handleUniversitySubmit() {
    const raw = uniSearchInput.value.trim()
    if (!raw) return

    uniSearchInput.classList.add('uni-selected')
    hideAllPanels()

    // Store university locally
    localStorage.setItem('uplate_university', raw)

    if (isPurdue(raw)) {
        // Purdue → show download buttons
        if (downloadButtons) showPanel(downloadButtons)
    } else {
        // Other university → show waitlist
        if (waitlistPanel) {
            if (waitlistUniName) waitlistUniName.textContent = raw
            showPanel(waitlistPanel)
            if (waitlistSuccess) waitlistSuccess.classList.add('tw-hidden')
            if (waitlistForm) waitlistForm.classList.remove('tw-hidden')
        }
    }
}

if (uniSearchInput) {
    // Reset panels when user edits
    uniSearchInput.addEventListener('input', function () {
        uniSearchInput.classList.remove('uni-selected')
        hideAllPanels()
        
        // Clear email input and reset form state
        if (waitlistEmail) waitlistEmail.value = ''
        if (waitlistSuccess) waitlistSuccess.classList.add('tw-hidden')
        if (waitlistError) waitlistError.classList.add('tw-hidden')
        if (waitlistForm) waitlistForm.classList.remove('tw-hidden')
    })

    // Submit on Enter key
    uniSearchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleUniversitySubmit()
        }
    })
}

// Validate if email is from an educational institution
function isValidSchoolEmail(email) {
    const eduDomains = [
        '.edu',           // US universities
        '.ac.uk',         // UK universities
        '.edu.au',        // Australian universities
        '.ac.nz',         // New Zealand universities
        '.edu.sg',        // Singapore universities
        '.ac.in',         // Indian universities
        '.edu.cn',        // Chinese universities
        '.ac.jp',         // Japanese universities
        '.edu.br',        // Brazilian universities
        '.ac.za',         // South African universities
        '.edu.mx',        // Mexican universities
        '.ac.kr',         // Korean universities
        '.edu.co',        // Colombian universities
    ]
    
    // Blocked generic email providers
    const blockedDomains = [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
        'icloud.com', 'aol.com', 'protonmail.com', 'mail.com',
        'zoho.com', 'yandex.com', 'gmx.com'
    ]
    
    const emailLower = email.toLowerCase()
    const domain = emailLower.split('@')[1]
    
    if (!domain) return false
    
    // Check if it's a blocked domain
    if (blockedDomains.includes(domain)) {
        return false
    }
    
    // Check if it ends with an educational domain
    return eduDomains.some(eduDomain => domain.endsWith(eduDomain))
}

// Handle waitlist form submission
const waitlistError = document.getElementById('waitlist-error')

if (waitlistForm) {
    // Clear error when user types
    if (waitlistEmail) {
        waitlistEmail.addEventListener('input', function () {
            if (waitlistError) waitlistError.classList.add('tw-hidden')
        })
    }
    
    waitlistForm.addEventListener('submit', async function (e) {
        e.preventDefault()
        const email = waitlistEmail.value.trim()
        if (!email) return

        // Validate school email
        if (!isValidSchoolEmail(email)) {
            if (waitlistError) {
                waitlistError.textContent = 'Please use a valid school email address (e.g., name@university.edu)'
                waitlistError.classList.remove('tw-hidden')
            }
            return
        }

        const uniName = waitlistUniName ? waitlistUniName.textContent : ''
        
        // Disable submit button while processing
        const submitBtn = document.getElementById('waitlist-submit')
        const originalBtnText = submitBtn ? submitBtn.textContent : ''
        if (submitBtn) {
            submitBtn.disabled = true
            submitBtn.textContent = 'Joining...'
        }

        try {
            // Convert university name to URL-safe format (lowercase, no spaces)
            const schoolSlug = uniName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
            
            // Call Cloudflare backend API
            const apiUrl = `https://boilerbites.com/waitlist/${encodeURIComponent(schoolSlug)}/${encodeURIComponent(email)}`
            
            // Use no-cors mode to bypass CORS restrictions (backend doesn't return CORS headers)
            // This sends the request successfully but we can't read the response
            await fetch(apiUrl, {
                method: 'GET',
                mode: 'no-cors'
            })

            // Also store locally as backup
            const waitlistData = {
                email: email,
                university: uniName,
                timestamp: new Date().toISOString()
            }
            const existing = JSON.parse(localStorage.getItem('uplate_waitlist') || '[]')
            existing.push(waitlistData)
            localStorage.setItem('uplate_waitlist', JSON.stringify(existing))

            // Show success, hide form and error
            waitlistForm.classList.add('tw-hidden')
            if (waitlistError) waitlistError.classList.add('tw-hidden')
            if (waitlistSuccess) waitlistSuccess.classList.remove('tw-hidden')
            
        } catch (error) {
            console.error('Waitlist API error:', error)
            
            // Show error to user
            if (waitlistError) {
                waitlistError.textContent = 'Something went wrong. Please try again.'
                waitlistError.classList.remove('tw-hidden')
            }
            
            // Re-enable button
            if (submitBtn) {
                submitBtn.disabled = false
                submitBtn.textContent = originalBtnText
            }
        }
    })
}

} 

// Run init when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
} else {
    init()
}
