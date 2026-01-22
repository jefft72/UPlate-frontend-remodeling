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

// Only run intro/typewriter on home page (where intro-screen exists)
// AND only if user hasn't seen it this session
if (introScreen && typewriterText) {
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

} 

// Run init when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
} else {
    init()
}
