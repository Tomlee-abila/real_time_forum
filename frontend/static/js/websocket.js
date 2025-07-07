// WebSocket client for real-time messaging
class WebSocketClient {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.isConnecting = false; // Prevent multiple simultaneous connection attempts
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Start with 1 second
        this.messageHandlers = new Map();
        this.connectionListeners = [];
        
        // Bind methods to preserve 'this' context
        this.onOpen = this.onOpen.bind(this);
        this.onMessage = this.onMessage.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onError = this.onError.bind(this);

        // Add page unload handler for graceful disconnect
        this.setupPageUnloadHandler();
    }

    // Connect to WebSocket server
    connect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('WebSocket already connected');
            return;
        }

        if (this.isConnecting) {
            console.log('WebSocket connection already in progress');
            return;
        }

        // Check if user is authenticated before connecting
        if (!window.currentUserId) {
            console.log('WebSocket connection skipped - user not authenticated, currentUserId:', window.currentUserId);
            return;
        }

        console.log('WebSocket connecting for user:', window.currentUserId);
        this.isConnecting = true;

        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws`;
            
            console.log('Connecting to WebSocket:', wsUrl);
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = this.onOpen;
            this.ws.onmessage = this.onMessage;
            this.ws.onclose = this.onClose;
            this.ws.onerror = this.onError;
            
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            this.isConnecting = false;
            this.scheduleReconnect();
        }
    }

    // Handle WebSocket connection opened
    onOpen(event) {
        console.log('WebSocket connected successfully');
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        
        // Notify connection listeners
        this.connectionListeners.forEach(listener => {
            if (typeof listener.onConnect === 'function') {
                listener.onConnect();
            }
        });
    }

    // Handle incoming WebSocket messages
    onMessage(event) {
        try {
            const data = JSON.parse(event.data);

            // Handle system events first
            if (data.type === 'ping') {
                this.handlePing(data);
                return;
            }

            console.log('WebSocket message received:', data);

            // Route message to appropriate handler
            if (data.type && this.messageHandlers.has(data.type)) {
                const handler = this.messageHandlers.get(data.type);
                handler(data);
            } else {
                console.warn('No handler for message type:', data.type);
            }

        } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
        }
    }

    // Handle WebSocket connection closed
    onClose(event) {
        console.log('WebSocket connection closed:', event.code, event.reason);
        this.isConnected = false;
        this.isConnecting = false;

        // Notify connection listeners
        this.connectionListeners.forEach(listener => {
            if (typeof listener.onDisconnect === 'function') {
                listener.onDisconnect();
            }
        });

        // Only reconnect for specific error conditions, not user-initiated closes
        const shouldReconnect = this.shouldAttemptReconnect(event.code, event.reason);
        if (shouldReconnect) {
            console.log(`Attempting reconnection for close code: ${event.code}`);
            this.scheduleReconnect();
        } else {
            console.log(`Not reconnecting for close code: ${event.code} (${event.reason})`);
            this.reconnectAttempts = 0; // Reset for future connections
        }
    }

    // Handle WebSocket errors
    onError(event) {
        console.error('WebSocket error:', event);
        this.isConnected = false;
        this.isConnecting = false;
    }

    // Determine if we should attempt reconnection based on close code
    shouldAttemptReconnect(code, reason) {
        // Don't reconnect for these codes:
        switch (code) {
            case 1000: // Normal closure
                return false;
            case 1001: // Going away (tab closing, navigation)
                return false;
            case 1002: // Protocol error
                return false;
            case 1003: // Unsupported data
                return false;
            case 1005: // No status received
                return false;
            case 1015: // TLS handshake failure
                return false;
            case 4000: // Custom: Authentication failed
            case 4001: // Custom: Authorization failed
            case 4002: // Custom: Invalid session
                console.log('Authentication/authorization failed, not reconnecting');
                return false;
            case 1006: // Abnormal closure (network issues)
            case 1011: // Server error
            case 1012: // Service restart
            case 1013: // Try again later
            case 1014: // Bad gateway
                // These might be temporary, allow reconnection
                return true;
            default:
                // For unknown codes, be conservative and allow reconnection
                return true;
        }
    }

    // Schedule reconnection attempt
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
        
        setTimeout(() => {
            if (!this.isConnected) {
                this.connect();
            }
        }, delay);
    }

    // Send message through WebSocket
    send(type, data = {}) {
        if (!this.isConnected || !this.ws) {
            console.error('WebSocket not connected, cannot send message');
            return false;
        }

        try {
            const message = {
                type: type,
                data: data,
                timestamp: new Date().toISOString()
            };
            
            this.ws.send(JSON.stringify(message));
            console.log('WebSocket message sent:', message);
            return true;
            
        } catch (error) {
            console.error('Failed to send WebSocket message:', error);
            return false;
        }
    }

    // Register message handler for specific event type
    onMessage(eventType, handler) {
        this.messageHandlers.set(eventType, handler);
    }

    // Register connection listener
    addConnectionListener(listener) {
        this.connectionListeners.push(listener);
    }

    // Remove connection listener
    removeConnectionListener(listener) {
        const index = this.connectionListeners.indexOf(listener);
        if (index > -1) {
            this.connectionListeners.splice(index, 1);
        }
    }

    // Handle ping from server
    handlePing(data) {
        console.log('Received ping, sending pong');
        const pongMessage = {
            type: 'pong',
            timestamp: Date.now(),
            user_id: window.currentUserId
        };
        this.send(pongMessage);
    }

    // Setup page unload handler for graceful disconnect
    setupPageUnloadHandler() {
        window.addEventListener('beforeunload', () => {
            if (this.isConnected && this.ws) {
                // Send a clean disconnect
                this.ws.close(1000, 'Page unloading');
            }
        });

        window.addEventListener('unload', () => {
            if (this.isConnected && this.ws) {
                this.ws.close(1000, 'Page unloading');
            }
        });
    }

    // Disconnect WebSocket
    disconnect() {
        if (this.ws) {
            this.ws.close(1000, 'Client disconnecting');
            this.ws = null;
        }
        this.isConnected = false;
        this.isConnecting = false;
    }

    // Get connection status
    getStatus() {
        return {
            isConnected: this.isConnected,
            readyState: this.ws ? this.ws.readyState : WebSocket.CLOSED,
            reconnectAttempts: this.reconnectAttempts
        };
    }
}

// Export for use in other modules
window.WebSocketClient = WebSocketClient;
