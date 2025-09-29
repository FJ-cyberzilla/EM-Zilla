export default class MobileAdapter {
    constructor() {
        this.isMobile = this.detectMobile();
        this.isTermux = this.detectTermux();
        this.setupMobileFeatures();
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    detectTermux() {
        return navigator.userAgent.includes('Termux') || 
               window.Android !== undefined;
    }

    setupMobileFeatures() {
        if (this.isMobile) {
            this.addTouchEvents();
            this.adaptLayoutForMobile();
            this.setupMobileGestures();
        }
    }

    addTouchEvents() {
        // Add touch-specific event handlers
        document.addEventListener('touchstart', this.handleTouchStart, { passive: true });
        document.addEventListener('touchmove', this.handleTouchMove, { passive: true });
    }

    adaptLayoutForMobile() {
        // Adjust UI for mobile screens
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                .main-content {
                    grid-template-columns: 1fr;
                    gap: 15px;
                }
                
                .nav-tabs {
                    flex-direction: column;
                }
                
                .vita-button {
                    padding: 15px 20px;
                    font-size: 14px;
                }
                
                .code-output {
                    font-size: 12px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    setupMobileGestures() {
        let startX, startY;

        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;

            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;

            const diffX = startX - endX;
            const diffY = startY - endY;

            // Swipe left/right for tab navigation
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    this.nextTab();
                } else {
                    this.previousTab();
                }
            }
        });
    }
}
