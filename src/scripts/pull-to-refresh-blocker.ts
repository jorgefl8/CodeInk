/**
 * Prevents pull-to-refresh on mobile browsers (especially Brave Android)
 * that ignore the CSS `overscroll-behavior: none` property.
 *
 * Works by intercepting touchmove events when the user is at the top of
 * the page and swiping downward, which is the gesture that triggers
 * pull-to-refresh.
 */
let startY = 0

function onTouchStart(e: TouchEvent) {
    startY = e.touches[0].clientY
}

function onTouchMove(e: TouchEvent) {
    const y = e.touches[0].clientY
    const scrollTop = window.scrollY || document.documentElement.scrollTop

    // User is at the top (or nearly) and swiping down → block pull-to-refresh
    if (scrollTop <= 0 && y > startY) {
        e.preventDefault()
    }
}

export function initPullToRefreshBlocker() {
    document.addEventListener("touchstart", onTouchStart, { passive: true })
    document.addEventListener("touchmove", onTouchMove, { passive: false })
}
