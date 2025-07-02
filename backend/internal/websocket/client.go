package websocket

import (
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const (
	// Time allowed to write a message to the peer
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer
	maxMessageSize = 1024
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow connections from any origin in development
		// In production, you should check the origin properly
		return true
	},
}

// Client represents a WebSocket client connection
type Client struct {
	// The WebSocket connection
	conn *websocket.Conn

	// Buffered channel of outbound messages
	send chan []byte

	// The hub that manages this client
	hub *Hub

	// User information
	userID   string
	nickname string

	// Mutex for thread-safe operations
	mutex sync.RWMutex

	// Last activity time
	lastActivity time.Time
}

// NewClient creates a new WebSocket client
func NewClient(hub *Hub, conn *websocket.Conn, userID, nickname string) *Client {
	return &Client{
		conn:         conn,
		send:         make(chan []byte, 256),
		hub:          hub,
		userID:       userID,
		nickname:     nickname,
		lastActivity: time.Now(),
	}
}

// GetUserID returns the client's user ID
func (c *Client) GetUserID() string {
	c.mutex.RLock()
	defer c.mutex.RUnlock()
	return c.userID
}

// GetNickname returns the client's nickname
func (c *Client) GetNickname() string {
	c.mutex.RLock()
	defer c.mutex.RUnlock()
	return c.nickname
}

// UpdateActivity updates the client's last activity time
func (c *Client) UpdateActivity() {
	c.mutex.Lock()
	defer c.mutex.Unlock()
	c.lastActivity = time.Now()
}

// ReadPump pumps messages from the WebSocket connection to the hub
func (c *Client) ReadPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		c.UpdateActivity()
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				// log.Printf("WebSocket error: %v", err) // Will add when log import works
			}
			break
		}

		c.UpdateActivity()
		c.handleMessage(message)
	}
}

// WritePump pumps messages from the hub to the WebSocket connection
func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued messages to the current WebSocket message
			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// handleMessage processes incoming WebSocket messages
func (c *Client) handleMessage(message []byte) {
	// For now, just echo back - will implement proper message handling later
	// var event Event
	// if err := json.Unmarshal(message, &event); err != nil {
	//     log.Printf("Error unmarshaling message: %v", err)
	//     return
	// }

	// Simple echo for testing
	c.send <- message
}

// sendEvent sends an event to the client
func (c *Client) sendEvent(event *Event) {
	// data, err := json.Marshal(event)
	// if err != nil {
	//     log.Printf("Error marshaling event: %v", err)
	//     return
	// }

	// select {
	// case c.send <- data:
	// default:
	//     close(c.send)
	// }
}

// Close closes the client connection
func (c *Client) Close() {
	close(c.send)
}
