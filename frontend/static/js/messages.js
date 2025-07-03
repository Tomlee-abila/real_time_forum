// Handles private messaging UI and WebSocket events
class MessagingManager {
    constructor() {
        this.wsClient = null;
        this.currentConversation = null;
        this.conversations = new Map();
        this.onlineUsers = new Set();
        this.messageHistory = new Map();
        this.isTyping = false;
        this.typingTimeout = null;

        // Pagination settings
        this.messagesPerPage = 10;
        this.currentPage = 1;

        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    // Initialize messaging system
    init() {
        console.log('Initializing MessagingManager');
        this.setupWebSocket();
        this.setupEventListeners();
        this.loadConversations();
        this.loadOnlineUsers();
    }

    // Setup WebSocket connection and handlers
    setupWebSocket() {
        if (window.WebSocketClient) {
            this.wsClient = new window.WebSocketClient();

            // Register message handlers
            this.wsClient.onMessage('new_message', (data) => this.handleNewMessage(data));
            this.wsClient.onMessage('message_read', (data) => this.handleMessageRead(data));
            this.wsClient.onMessage('user_online', (data) => this.handleUserOnline(data));
            this.wsClient.onMessage('user_offline', (data) => this.handleUserOffline(data));
            this.wsClient.onMessage('typing_start', (data) => this.handleTypingStart(data));
            this.wsClient.onMessage('typing_stop', (data) => this.handleTypingStop(data));
            this.wsClient.onMessage('connected', (data) => this.handleConnected(data));
            this.wsClient.onMessage('error', (data) => this.handleError(data));

            // Add connection listener
            this.wsClient.addConnectionListener({
                onConnect: () => this.onWebSocketConnect(),
                onDisconnect: () => this.onWebSocketDisconnect()
            });

            // Connect to WebSocket
            this.wsClient.connect();
        } else {
            console.error('WebSocketClient not available');
        }
    }

    // Setup UI event listeners
    setupEventListeners() {
        // Message send form
        const messageForm = document.getElementById('message-form');
        if (messageForm) {
            messageForm.addEventListener('submit', (e) => this.handleSendMessage(e));
        }

        // Message input for typing indicators
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            messageInput.addEventListener('input', () => this.handleTyping());
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSendMessage(e);
                }
            });
        }

        // Conversation list clicks
        const conversationList = document.getElementById('conversation-list');
        if (conversationList) {
            conversationList.addEventListener('click', (e) => this.handleConversationClick(e));
        }

        // Online users list clicks
        const onlineUsersList = document.getElementById('online-users-list');
        if (onlineUsersList) {
            onlineUsersList.addEventListener('click', (e) => this.handleOnlineUserClick(e));
        }

        // Message history scroll for pagination
        const messageContainer = document.getElementById('message-container');
        if (messageContainer) {
            messageContainer.addEventListener('scroll', () => this.handleMessageScroll());
        }
    }

    // WebSocket connection established
    onWebSocketConnect() {
        console.log('WebSocket connected - messaging system ready');
        this.updateConnectionStatus(true);
        this.loadOnlineUsers();
    }

    // WebSocket connection lost
    onWebSocketDisconnect() {
        console.log('WebSocket disconnected - messaging system offline');
        this.updateConnectionStatus(false);
    }

    // Update connection status in UI
    updateConnectionStatus(isConnected) {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.textContent = isConnected ? 'Connected' : 'Disconnected';
            statusElement.className = isConnected ? 'status-connected' : 'status-disconnected';
        }
    }

    // Handle incoming new message
    handleNewMessage(data) {
        console.log('New message received:', data);
        if (data.data && data.data.message) {
            const message = data.data.message;
            this.addMessageToHistory(message);
            this.updateConversationList(message);

            // If this is the current conversation, display the message
            if (this.currentConversation &&
                (message.sender_id === this.currentConversation ||
                 message.receiver_id === this.currentConversation)) {
                this.displayMessage(message);
            }

            // Play notification sound or show notification
            this.showNotification(message);
        }
    }

    // Handle message read confirmation
    handleMessageRead(data) {
        console.log('Message read confirmation:', data);
        if (data.data && this.currentConversation) {
            this.markMessagesAsRead(data.data.sender_id);
        }
    }

    // Handle user coming online
    handleUserOnline(data) {
        console.log('User came online:', data);
        if (data.data && data.data.user_status) {
            const user = data.data.user_status;
            this.onlineUsers.add(user.user_id);
            this.updateOnlineUsersList();
            this.updateUserStatusInConversations(user.user_id, true);
            this.updateOnlineUserCount();
        }
    }

    // Handle user going offline
    handleUserOffline(data) {
        console.log('User went offline:', data);
        if (data.data && data.data.user_status) {
            const user = data.data.user_status;
            this.onlineUsers.delete(user.user_id);
            this.updateOnlineUsersList();
            this.updateUserStatusInConversations(user.user_id, false);
            this.updateOnlineUserCount();
        }
    }

    // Handle typing start indicator
    handleTypingStart(data) {
        console.log('User started typing:', data);
        if (data.data && data.data.user_id === this.currentConversation) {
            this.showTypingIndicator(data.data.user_nickname);
        }
    }

    // Handle typing stop indicator
    handleTypingStop(data) {
        console.log('User stopped typing:', data);
        if (data.data && data.data.user_id === this.currentConversation) {
            this.hideTypingIndicator();
        }
    }

    // Handle WebSocket connected event
    handleConnected(data) {
        console.log('WebSocket connection confirmed:', data);
    }

    // Handle WebSocket error
    handleError(data) {
        console.error('WebSocket error received:', data);
        if (data.data && data.data.message) {
            this.showErrorMessage(data.data.message);
        }
    }

    // Handle send message form submission
    async handleSendMessage(event) {
        event.preventDefault();

        const messageInput = document.getElementById('message-input');
        if (!messageInput || !this.currentConversation) return;

        const content = messageInput.value.trim();
        if (!content) return;

        try {
            // Send via API
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    receiver_id: this.currentConversation,
                    content: content
                })
            });

            if (response.ok) {
                messageInput.value = '';
                this.stopTyping();
            } else {
                const error = await response.json();
                this.showErrorMessage(error.error || 'Failed to send message');
            }

        } catch (error) {
            console.error('Error sending message:', error);
            this.showErrorMessage('Failed to send message');
        }
    }

    // Handle typing in message input
    handleTyping() {
        if (!this.currentConversation || !this.wsClient) return;

        if (!this.isTyping) {
            this.isTyping = true;
            this.wsClient.send('typing_start', {
                receiver_id: this.currentConversation
            });
        }

        // Reset typing timeout
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.stopTyping();
        }, 3000); // Stop typing after 3 seconds of inactivity
    }

    // Stop typing indicator
    stopTyping() {
        if (this.isTyping && this.currentConversation && this.wsClient) {
            this.isTyping = false;
            this.wsClient.send('typing_stop', {
                receiver_id: this.currentConversation
            });
        }
        clearTimeout(this.typingTimeout);
    }

    // Handle conversation list click
    handleConversationClick(event) {
        const conversationItem = event.target.closest('.conversation-item');
        if (conversationItem) {
            const userId = conversationItem.dataset.userId;
            this.openConversation(userId);
        }
    }

    // Handle online user click
    handleOnlineUserClick(event) {
        const userItem = event.target.closest('.online-user-item');
        if (userItem) {
            const userId = userItem.dataset.userId;
            this.openConversation(userId);
        }
    }

    // Handle message container scroll for pagination
    handleMessageScroll() {
        const container = document.getElementById('message-container');
        if (!container || !this.currentConversation) return;

        // Check if scrolled to top (load more messages)
        if (container.scrollTop === 0 && this.hasMoreMessages()) {
            this.loadMoreMessages();
        }
    }

    // Load conversations from API
    async loadConversations() {
        try {
            const response = await fetch('/api/messages/conversations');
            if (response.ok) {
                const data = await response.json();
                this.conversations.clear();

                if (data.conversations) {
                    data.conversations.forEach(conv => {
                        this.conversations.set(conv.user_id, conv);
                    });
                }

                this.updateConversationsList();
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    }

    // Load online users from API
    async loadOnlineUsers() {
        try {
            const response = await fetch('/api/users/online');
            if (response.ok) {
                const data = await response.json();
                this.onlineUsers.clear();

                if (data.users) {
                    data.users.forEach(user => {
                        this.onlineUsers.add(user.user_id);
                    });
                }

                this.updateOnlineUsersList();
            }
        } catch (error) {
            console.error('Error loading online users:', error);
        }
    }

    // Open conversation with specific user
    async openConversation(userId) {
        this.currentConversation = userId;
        this.currentPage = 1;

        // Load message history
        await this.loadMessageHistory(userId);

        // Mark messages as read
        await this.markConversationAsRead(userId);

        // Update UI
        this.updateConversationUI(userId);
    }

    // Load message history for conversation
    async loadMessageHistory(userId, page = 1) {
        try {
            const response = await fetch(
                `/api/messages/history/${userId}?limit=${this.messagesPerPage}&offset=${(page - 1) * this.messagesPerPage}`
            );

            if (response.ok) {
                const data = await response.json();

                if (!this.messageHistory.has(userId)) {
                    this.messageHistory.set(userId, []);
                }

                const messages = this.messageHistory.get(userId);
                if (page === 1) {
                    // Replace messages for first page
                    this.messageHistory.set(userId, data.messages || []);
                } else {
                    // Prepend messages for pagination
                    this.messageHistory.set(userId, [...(data.messages || []), ...messages]);
                }

                this.displayMessages(userId);
                return data;
            }
        } catch (error) {
            console.error('Error loading message history:', error);
        }
        return null;
    }

    // Display messages for current conversation
    displayMessages(userId) {
        const container = document.getElementById('message-container');
        if (!container || userId !== this.currentConversation) return;

        const messages = this.messageHistory.get(userId) || [];
        container.innerHTML = '';

        if (messages.length === 0) {
            container.innerHTML = '<div class="no-conversation"><p>No messages yet. Start the conversation!</p></div>';
            return;
        }

        messages.forEach(message => {
            this.displayMessage(message, false);
        });

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    // Display a single message
    displayMessage(message, scrollToBottom = true) {
        const container = document.getElementById('message-container');
        if (!container) return;

        // Remove no-conversation message if present
        const noConversation = container.querySelector('.no-conversation');
        if (noConversation) {
            noConversation.remove();
        }

        const messageElement = this.createMessageElement(message);
        container.appendChild(messageElement);

        if (scrollToBottom) {
            container.scrollTop = container.scrollHeight;
        }
    }

    // Create message HTML element
    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${this.isCurrentUserMessage(message) ? 'sent' : 'received'}`;

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = message.content;

        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = this.formatMessageTime(message.created_at);

        messageDiv.appendChild(bubble);
        messageDiv.appendChild(time);

        return messageDiv;
    }

    // Check if message is from current user
    isCurrentUserMessage(message) {
        // This would need to be set from the current user's session
        // For now, we'll use a placeholder
        return message.sender_id === this.getCurrentUserId();
    }

    // Get current user ID (placeholder - should be set from session)
    getCurrentUserId() {
        // This should be set from the user session
        return window.currentUserId || null;
    }

    // Format message timestamp
    formatMessageTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString();
    }

    // Update conversations list UI
    updateConversationsList() {
        const container = document.getElementById('conversation-list');
        if (!container) return;

        container.innerHTML = '';

        // Sort conversations by last message time
        const sortedConversations = Array.from(this.conversations.values())
            .sort((a, b) => {
                const aTime = a.last_message ? new Date(a.last_message.created_at) : new Date(0);
                const bTime = b.last_message ? new Date(b.last_message.created_at) : new Date(0);
                return bTime - aTime;
            });

        sortedConversations.forEach(conversation => {
            const item = this.createConversationItem(conversation);
            container.appendChild(item);
        });
    }

    // Create conversation list item
    createConversationItem(conversation) {
        const item = document.createElement('div');
        item.className = 'conversation-item';
        item.dataset.userId = conversation.user_id;

        if (conversation.user_id === this.currentConversation) {
            item.classList.add('active');
        }

        const content = document.createElement('div');
        content.className = 'conversation-content';

        const name = document.createElement('div');
        name.className = 'user-name';
        name.textContent = conversation.user_nickname;

        const lastMessage = document.createElement('div');
        lastMessage.className = 'last-message';
        if (conversation.last_message) {
            lastMessage.textContent = conversation.last_message.content.substring(0, 50) +
                (conversation.last_message.content.length > 50 ? '...' : '');
        } else {
            lastMessage.textContent = 'No messages yet';
        }

        content.appendChild(name);
        content.appendChild(lastMessage);
        item.appendChild(content);

        // Add unread count if any
        if (conversation.unread_count > 0) {
            const unreadBadge = document.createElement('div');
            unreadBadge.className = 'unread-count';
            unreadBadge.textContent = conversation.unread_count;
            item.appendChild(unreadBadge);
        }

        // Add online indicator
        if (conversation.is_online) {
            const onlineIndicator = document.createElement('div');
            onlineIndicator.className = 'online-indicator';
            item.appendChild(onlineIndicator);
        }

        return item;
    }

    // Update online users list UI
    updateOnlineUsersList() {
        const container = document.getElementById('online-users-list');
        if (!container) return;

        container.innerHTML = '';

        // Get online users (this would come from API)
        this.onlineUsers.forEach(userId => {
            // Skip current user
            if (userId === this.getCurrentUserId()) return;

            const item = this.createOnlineUserItem(userId);
            container.appendChild(item);
        });
    }

    // Create online user item
    createOnlineUserItem(userId) {
        const item = document.createElement('div');
        item.className = 'online-user-item';
        item.dataset.userId = userId;

        const name = document.createElement('div');
        name.className = 'user-name';
        name.textContent = `User ${userId}`; // This should be the actual nickname

        const indicator = document.createElement('div');
        indicator.className = 'online-indicator';

        item.appendChild(name);
        item.appendChild(indicator);

        return item;
    }

    // Update conversation UI when opening
    updateConversationUI(userId) {
        // Update header
        const header = document.getElementById('chat-header');
        const userName = document.getElementById('chat-user-name');
        const userStatus = document.getElementById('chat-user-status');
        const inputArea = document.getElementById('message-input-area');

        if (header) header.classList.remove('hidden');
        if (inputArea) inputArea.classList.remove('hidden');

        if (userName) {
            userName.textContent = `User ${userId}`; // Should be actual nickname
        }

        if (userStatus) {
            userStatus.textContent = this.onlineUsers.has(userId) ? 'Online' : 'Offline';
        }

        // Update active conversation in list
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.userId === userId) {
                item.classList.add('active');
            }
        });
    }

    // Show typing indicator
    showTypingIndicator(userNickname) {
        const indicator = document.getElementById('typing-indicator');
        const typingUser = document.getElementById('typing-user');

        if (indicator && typingUser) {
            typingUser.textContent = userNickname;
            indicator.classList.remove('hidden');
        }
    }

    // Hide typing indicator
    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.classList.add('hidden');
        }
    }

    // Show error message
    showErrorMessage(message) {
        // Create or update error message element
        let errorElement = document.getElementById('error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'error-message';
            errorElement.className = 'error-message';

            const container = document.getElementById('message-container');
            if (container) {
                container.parentNode.insertBefore(errorElement, container);
            }
        }

        errorElement.textContent = message;
        errorElement.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }

    // Show notification for new message
    showNotification(message) {
        // Only show notification if not current conversation or window not focused
        if (message.sender_id !== this.currentConversation || !document.hasFocus()) {
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(`New message from ${message.sender_nickname}`, {
                    body: message.content.substring(0, 100),
                    icon: '/favicon.ico'
                });
            }
        }
    }

    // Add message to history
    addMessageToHistory(message) {
        const otherUserId = message.sender_id === this.getCurrentUserId() ?
            message.receiver_id : message.sender_id;

        if (!this.messageHistory.has(otherUserId)) {
            this.messageHistory.set(otherUserId, []);
        }

        const messages = this.messageHistory.get(otherUserId);
        messages.push(message);
    }

    // Update conversation list with new message
    updateConversationList(message) {
        const otherUserId = message.sender_id === this.getCurrentUserId() ?
            message.receiver_id : message.sender_id;

        // Update or create conversation
        let conversation = this.conversations.get(otherUserId);
        if (!conversation) {
            conversation = {
                user_id: otherUserId,
                user_nickname: message.sender_id === this.getCurrentUserId() ?
                    message.receiver_nickname : message.sender_nickname,
                unread_count: 0,
                is_online: this.onlineUsers.has(otherUserId)
            };
        }

        conversation.last_message = message;

        // Increment unread count if not current conversation
        if (otherUserId !== this.currentConversation && message.sender_id !== this.getCurrentUserId()) {
            conversation.unread_count = (conversation.unread_count || 0) + 1;
        }

        this.conversations.set(otherUserId, conversation);
        this.updateConversationsList();
    }

    // Mark conversation as read
    async markConversationAsRead(userId) {
        try {
            const response = await fetch(`/api/messages/read/${userId}`, {
                method: 'PUT'
            });

            if (response.ok) {
                // Update local conversation
                const conversation = this.conversations.get(userId);
                if (conversation) {
                    conversation.unread_count = 0;
                    this.updateConversationsList();
                }
            }
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }

    // Check if there are more messages to load
    hasMoreMessages() {
        // This would be determined by the API response
        return false; // Placeholder
    }

    // Load more messages (pagination)
    async loadMoreMessages() {
        if (!this.currentConversation) return;

        this.currentPage++;
        await this.loadMessageHistory(this.currentConversation, this.currentPage);
    }

    // Update user status in conversations
    updateUserStatusInConversations(userId, isOnline) {
        const conversation = this.conversations.get(userId);
        if (conversation) {
            conversation.is_online = isOnline;
            this.updateConversationsList();
        }

        // Update current conversation status if applicable
        if (userId === this.currentConversation) {
            const userStatus = document.getElementById('chat-user-status');
            if (userStatus) {
                userStatus.textContent = isOnline ? 'Online' : 'Offline';
            }
        }
    }

    // Mark messages as read in UI
    markMessagesAsRead(senderUserId) {
        // Update conversation unread count
        const conversation = this.conversations.get(senderUserId);
        if (conversation) {
            conversation.unread_count = 0;
            this.updateConversationsList();
        }
    }

    // Update online user count in statistics
    updateOnlineUserCount() {
        const onlineUsersElement = document.getElementById('online-users');
        if (onlineUsersElement) {
            const count = this.onlineUsers.size;
            onlineUsersElement.textContent = count;
            onlineUsersElement.classList.remove('loading');
        }
    }
}

// Initialize messaging manager when script loads
window.messagingManager = new MessagingManager();