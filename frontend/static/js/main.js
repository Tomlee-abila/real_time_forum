// Main JS for initializing SPA and WebSocket client

class ForumApp {
    constructor() {
        this.init();
    }

    init() {
        console.log('Real Time Forum initialized');

        // Initialize navigation
        this.initNavigation();

        // Set up any global event listeners
        this.setupGlobalEvents();
    }

    initNavigation() {
        // Update navigation based on auth status
        this.updateNavigation();
    }

    updateNavigation() {
        const navLinks = document.getElementById('nav-links');
        if (!navLinks) return;

        // For now, just show basic navigation
        // This will be expanded when user is authenticated
        navLinks.innerHTML = `
            <span class="nav-status">Welcome to Real Time Forum</span>
        `;
    }

    setupGlobalEvents() {
        // Handle any global events here
        window.addEventListener('resize', () => {
            // Handle responsive behavior if needed
        });

        // Setup tab navigation
        this.setupTabNavigation();

        // Request notification permission
        this.requestNotificationPermission();
    }

    setupTabNavigation() {
        const postsTab = document.getElementById('posts-tab');
        const messagesTab = document.getElementById('messages-tab');
        const postsSection = document.getElementById('posts-section');
        const messagesSection = document.getElementById('messages-section');

        if (postsTab && messagesTab && postsSection && messagesSection) {
            postsTab.addEventListener('click', () => {
                this.switchTab('posts', postsTab, messagesTab, postsSection, messagesSection);
            });

            messagesTab.addEventListener('click', () => {
                this.switchTab('messages', messagesTab, postsTab, messagesSection, postsSection);
            });
        }
    }

    switchTab(activeTab, activeBtn, inactiveBtn, activeSection, inactiveSection) {
        // Update button states
        activeBtn.classList.add('active');
        inactiveBtn.classList.remove('active');

        // Update section visibility
        activeSection.classList.remove('hidden');
        inactiveSection.classList.add('hidden');

        // If switching to messages, ensure messaging system is initialized
        if (activeTab === 'messages' && window.messagingManager) {
            // Refresh data when switching to messages
            window.messagingManager.loadConversations();
            window.messagingManager.loadOnlineUsers();
        }
    }

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                console.log('Notification permission:', permission);
            });
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.forumApp = new ForumApp();
});