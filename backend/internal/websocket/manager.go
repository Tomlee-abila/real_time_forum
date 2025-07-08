package websocket

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/Tomlee-abila/real_time_forum/backend/internal/database"
)

// BroadcastMessage represents a message to be broadcast
type BroadcastMessage struct {
	event      *Event
	targetUser string // If empty, broadcast to all
	sender     *Client
}

// Hub maintains the set of active clients and broadcasts messages to the clients
type Hub struct {
	// Registered clients
	clients map[*Client]bool

	// Inbound messages from the clients
	broadcast chan *BroadcastMessage

	// Register requests from the clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Mutex for thread-safe operations
	mutex sync.RWMutex

	// Map of user ID to client for direct messaging
	userClients map[string]*Client
}

// NewHub creates a new WebSocket hub
func NewHub() *Hub {
	return &Hub{
		broadcast:   make(chan *BroadcastMessage),
		register:    make(chan *Client),
		unregister:  make(chan *Client),
		clients:     make(map[*Client]bool),
		userClients: make(map[string]*Client),
	}
}

// Run starts the hub and handles client registration/unregistration and message broadcasting
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.registerClient(client)

		case client := <-h.unregister:
		Payee:
			h.unregisterClient(client)

		case message := <-h.broadcast:
			h.broadcastMessage(message)
		}
	}
}

// registerClient registers a new client
func (h *Hub) registerClient(client *Client) {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	userID := client.GetUserID()

	// Check if user already has a connection
	if existingClient, exists := h.userClients[userID]; exists {
		log.Printf("User %s (%s) already connected, closing existing connection", client.GetNickname(), userID)

		// Clean up existing client
		delete(h.clients, existingClient)
		delete(h.userClients, userID)
		close(existingClient.send)

		// Note: We don't send disconnect events here to avoid confusion
		// The old connection will be cleaned up naturally
	}

	// Register new client
	h.clients[client] = true
	h.userClients[userID] = client

	log.Printf("Client registered: %s (%s)", client.GetNickname(), userID)

	// Send connected event to client
	connectedEvent := CreateConnectedEvent(userID)
	h.sendToClient(client, connectedEvent)

	// Broadcast updated user stats
	h.broadcastUserStats()
}

// unregisterClient unregisters a client
func (h *Hub) unregisterClient(client *Client) {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	if _, ok := h.clients[client]; ok {
		delete(h.clients, client)
		delete(h.userClients, client.GetUserID())
		close(client.send)
		log.Printf("Client unregistered: %s (%s)", client.GetNickname(), client.GetUserID())

		// Broadcast updated user stats
		h.broadcastUserStats()
	}
}

// broadcastMessage broadcasts a message to clients
func (h *Hub) broadcastMessage(message *BroadcastMessage) {
	if message.targetUser != "" {
		// Send to specific user
		h.sendToUser(message.targetUser, message.event)
	} else {
		// Broadcast to all clients
		h.sendToAll(message.event)
	}
}

// sendToClient sends an event to a specific client
func (h *Hub) sendToClient(client *Client, event *Event) {
	data, err := json.Marshal(event)
	if err != nil {
		log.Printf("Error marshaling event: %v", err)
		return
	}

	select {
	case client.send <- data:
	default:
		close(client.send)
		delete(h.clients, client)
		delete(h.userClients, client.GetUserID())
	}
}

// sendToUser sends an event to a specific user by user ID
func (h *Hub) sendToUser(userID string, event *Event) {
	h.mutex.RLock()
	client, exists := h.userClients[userID]
	h.mutex.RUnlock()

	if exists {
		h.sendToClient(client, event)
	}
}

// sendToAll sends an event to all connected clients
func (h *Hub) sendToAll(event *Event) {
	h.mutex.RLock()
	clients := make([]*Client, 0, len(h.clients))
	for client := range h.clients {
		clients = append(clients, client)
	}
	h.mutex.RUnlock()

	for _, client := range clients {
		h.sendToClient(client, event)
	}
}

// BroadcastMessageFromAPI broadcasts a message from API (not from WebSocket client)
func (h *Hub) BroadcastMessageFromAPI(event *Event, targetUserID string) {
	broadcastMsg := &BroadcastMessage{
		event:      event,
		targetUser: targetUserID,
		sender:     nil, // No sender client for API calls
	}

	select {
	case h.broadcast <- broadcastMsg:
		// Message queued for broadcast
	default:
		// Hub broadcast channel is full, log but continue
		log.Printf("Hub broadcast channel full, message dropped")
	}
}

// GetOnlineUserCount returns the number of currently connected users
func (h *Hub) GetOnlineUserCount() int {
	h.mutex.RLock()
	defer h.mutex.RUnlock()
	return len(h.userClients)
}

// GetOnlineUsers returns a list of currently connected user IDs
func (h *Hub) GetOnlineUsers() []string {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	users := make([]string, 0, len(h.userClients))
	for userID := range h.userClients {
		users = append(users, userID)
	}
	return users
}

// GetOnlineUserDetails returns detailed information about online users
func (h *Hub) GetOnlineUserDetails() []map[string]interface{} {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	users := make([]map[string]interface{}, 0, len(h.userClients))
	for userID, client := range h.userClients {
		users = append(users, map[string]interface{}{
			"user_id":   userID,
			"nickname":  client.nickname,
			"connected": true,
		})
	}
	return users
}

// broadcastUserStats broadcasts current user statistics to all clients
func (h *Hub) broadcastUserStats() {
	totalUsers, err := database.GetTotalUserCount()
	if err != nil {
		log.Printf("Error getting total user count: %v", err)
		return
	}
	onlineUsers := h.GetOnlineUserCount()
	offlineUsers := totalUsers - onlineUsers

	statsEvent := CreateUserStatsEvent(totalUsers, onlineUsers, offlineUsers)
	h.sendToAll(statsEvent)
}
