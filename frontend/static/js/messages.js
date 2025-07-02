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