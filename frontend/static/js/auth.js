// Handles registration, login, and logout

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check if user is already logged in
        this.checkAuthStatus();

        // Bind event listeners
        this.bindEvents();
    }

    bindEvents() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => this.handleLogout(e));
        }

        // View switching
        const showRegister = document.getElementById('show-register');
        const showLogin = document.getElementById('show-login');

        if (showRegister) {
            showRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.showView('register');
            });
        }

        if (showLogin) {
            showLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.showView('login');
            });
        }
    }

    async handleLogin(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);
        const loginData = {
            email_or_nickname: formData.get('email_or_nickname'),
            password: formData.get('password')
        };

        // Clear previous errors
        this.clearError('login-error');

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData),
                credentials: 'include' // Include cookies
            });

            const result = await response.json();

            if (response.ok) {
                // Login successful
                this.currentUser = result.user;
                window.currentUserId = result.user.id; // Set for messaging system
                this.showView('home');
                this.updateUserInfo(result.user);
                this.loadUserStats(); // Load user statistics
                this.startMessagingSystem(); // Start WebSocket and load messaging data
                form.reset();
            } else {
                // Login failed
                this.showError('login-error', result.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('login-error', 'Network error. Please try again.');
        }
    }

    async handleRegister(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);
        const registerData = {
            nickname: formData.get('nickname'),
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            age: parseInt(formData.get('age')),
            gender: formData.get('gender'),
            email: formData.get('email'),
            password: formData.get('password')
        };

        // Clear previous errors
        this.clearError('register-error');

        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(registerData)
            });

            const result = await response.json();

            if (response.ok) {
                // Registration successful
                this.showView('login');
                this.showError('login-error', 'Registration successful! Please login.', 'success');
                form.reset();
            } else {
                // Registration failed
                this.showError('register-error', result.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('register-error', 'Network error. Please try again.');
        }
    }

    async handleLogout(event) {
        event.preventDefault();

        try {
            const response = await fetch('/logout', {
                method: 'POST',
                credentials: 'include' // Include cookies
            });

            const result = await response.json();

            if (response.ok) {
                // Logout successful
                this.currentUser = null;
                this.disconnectMessagingSystem();
                this.showView('login');
                this.clearUserInfo();
            } else {
                console.error('Logout failed:', result.error);
                // Even if logout fails on server, clear client state
                this.currentUser = null;
                this.disconnectMessagingSystem();
                this.showView('login');
                this.clearUserInfo();
            }
        } catch (error) {
            console.error('Logout error:', error);
            // Even if network error, clear client state
            this.currentUser = null;
            this.disconnectMessagingSystem();
            this.showView('login');
            this.clearUserInfo();
        }
    }

    async checkAuthStatus() {
        try {
            // Check if user has a valid session by calling /me endpoint
            const response = await fetch('/me', {
                method: 'GET',
                credentials: 'include' // Include cookies
            });

            if (response.ok) {
                // User is already logged in
                const result = await response.json();
                this.currentUser = result.user;
                window.currentUserId = result.user.id; // Set for messaging system
                this.showView('home');
                this.updateUserInfo(result.user);
                this.loadUserStats(); // Load user statistics
                this.startMessagingSystem(); // Start WebSocket and load messaging data
            } else {
                // No valid session, show login view
                this.showView('login');
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            // On error, show login view
            this.showView('login');
        }
    }

    showView(viewName) {
        // Hide all views
        const views = document.querySelectorAll('.view');
        views.forEach(view => view.classList.add('hidden'));

        // Show the requested view
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.remove('hidden');
        }
    }

    showError(elementId, message, type = 'error') {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.className = `error-message ${type}`;
            errorElement.style.display = 'block';
        }
    }

    clearError(elementId) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }

    updateUserInfo(user) {
        const userDetails = document.getElementById('user-details');
        if (userDetails && user) {
            userDetails.innerHTML = `
                <p><strong>ID:</strong> ${user.id}</p>
                <p><strong>Nickname:</strong> ${user.nickname}</p>
                <p><strong>Name:</strong> ${user.first_name} ${user.last_name}</p>
                <p><strong>Email:</strong> ${user.email}</p>
            `;
        }
    }

    clearUserInfo() {
        const userDetails = document.getElementById('user-details');
        if (userDetails) {
            userDetails.innerHTML = '';
        }
        window.currentUserId = null; // Clear for messaging system
        this.clearUserStats(); // Clear user statistics
        this.clearOnlineUsers(); // Clear online users list
    }

    // Start messaging system after login
    startMessagingSystem() {
        // Ensure messaging manager is available
        if (!window.messagingManager) {
            console.log('Messaging manager not ready, retrying in 100ms...');
            setTimeout(() => this.startMessagingSystem(), 100);
            return;
        }

        console.log('Starting messaging system...');

        // Start WebSocket connection
        if (typeof window.messagingManager.startWebSocketConnection === 'function') {
            window.messagingManager.startWebSocketConnection();
        } else {
            console.error('startWebSocketConnection method not found');
        }

        // Load online users list
        this.loadOnlineUsers();
    }

    // Disconnect messaging system on logout
    disconnectMessagingSystem() {
        // Disconnect WebSocket
        if (window.messagingManager && window.messagingManager.wsClient) {
            window.messagingManager.wsClient.disconnect();
        }
    }

    // Load user statistics from API
    async loadUserStats() {
        try {
            const response = await fetch('/api/users/stats');
            if (response.ok) {
                const data = await response.json();
                this.updateUserStats(data);
            } else {
                console.error('Failed to load user statistics');
                this.showUserStatsError();
            }
        } catch (error) {
            console.error('Error loading user statistics:', error);
            this.showUserStatsError();
        }
    }

    // Update user statistics display
    updateUserStats(stats) {
        const totalUsers = document.getElementById('total-users');
        const onlineUsers = document.getElementById('online-users');
        const onlineCount = document.getElementById('online-count');
        const offlineUsers = document.getElementById('offline-users');

        if (totalUsers) {
            totalUsers.textContent = stats.total_users || 0;
            totalUsers.classList.remove('loading');
        }

        if (onlineUsers) {
            onlineUsers.textContent = stats.online_users || 0;
            onlineUsers.classList.remove('loading');
        }

        if (onlineCount) {
            onlineCount.textContent = stats.online_users || 0;
        }

        if (offlineUsers) {
            offlineUsers.textContent = stats.offline_users || 0;
            offlineUsers.classList.remove('loading');
        }
    }

    // Clear user statistics
    clearUserStats() {
        const totalUsers = document.getElementById('total-users');
        const onlineUsers = document.getElementById('online-users');
        const offlineUsers = document.getElementById('offline-users');

        if (totalUsers) {
            totalUsers.textContent = 'Loading...';
            totalUsers.classList.add('loading');
        }

        if (onlineUsers) {
            onlineUsers.textContent = 'Loading...';
            onlineUsers.classList.add('loading');
        }

        if (offlineUsers) {
            offlineUsers.textContent = 'Loading...';
            offlineUsers.classList.add('loading');
        }
    }

    // Show error state for user statistics
    showUserStatsError() {
        const totalUsers = document.getElementById('total-users');
        const onlineUsers = document.getElementById('online-users');
        const offlineUsers = document.getElementById('offline-users');

        if (totalUsers) {
            totalUsers.textContent = 'Error';
            totalUsers.classList.remove('loading');
        }

        if (onlineUsers) {
            onlineUsers.textContent = 'Error';
            onlineUsers.classList.remove('loading');
        }

        if (offlineUsers) {
            offlineUsers.textContent = 'Error';
            offlineUsers.classList.remove('loading');
        }
    }

    // Load online users from API
    async loadOnlineUsers() {
        try {
            const response = await fetch('/api/users/online');
            if (response.ok) {
                const data = await response.json();
                this.updateOnlineUsersDisplay(data.users || [], data.count || 0);
            } else {
                console.error('Failed to load online users');
                this.showOnlineUsersError();
            }
        } catch (error) {
            console.error('Error loading online users:', error);
            this.showOnlineUsersError();
        }
    }

    // Update online users display
    updateOnlineUsersDisplay(users, count) {
        const onlineUsersDisplay = document.getElementById('online-users-display');
        const onlineCount = document.getElementById('online-count');
        const onlineUsersCount = document.getElementById('online-users');

        // Update counts
        if (onlineCount) {
            onlineCount.textContent = count;
        }
        if (onlineUsersCount) {
            onlineUsersCount.textContent = count;
            onlineUsersCount.classList.remove('loading');
        }

        if (!onlineUsersDisplay) return;

        // Clear loading message
        onlineUsersDisplay.innerHTML = '';

        if (users.length === 0) {
            onlineUsersDisplay.innerHTML = '<div class="no-users-message">No users currently online</div>';
            return;
        }

        // Create user tags
        users.forEach(user => {
            const userTag = document.createElement('span');
            userTag.className = 'online-user-tag';

            // Highlight current user
            if (user.user_id === window.currentUserId) {
                userTag.classList.add('current-user');
                userTag.textContent = `${user.nickname} (You)`;
            } else {
                userTag.textContent = user.nickname;
            }

            onlineUsersDisplay.appendChild(userTag);
        });
    }

    // Clear online users display
    clearOnlineUsers() {
        const onlineUsersDisplay = document.getElementById('online-users-display');
        const onlineCount = document.getElementById('online-count');

        if (onlineUsersDisplay) {
            onlineUsersDisplay.innerHTML = '<div class="loading-message">Loading online users...</div>';
        }

        if (onlineCount) {
            onlineCount.textContent = '0';
        }
    }

    // Show error state for online users
    showOnlineUsersError() {
        const onlineUsersDisplay = document.getElementById('online-users-display');

        if (onlineUsersDisplay) {
            onlineUsersDisplay.innerHTML = '<div class="no-users-message">Error loading online users</div>';
        }
    }
}

// Initialize AuthManager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});