package websocket

// EventType represents different types of WebSocket events
type EventType string

const (
	// Message events
	EventNewMessage  EventType = "new_message"
	EventMessageRead EventType = "message_read"
	EventTypingStart EventType = "typing_start"
	EventTypingStop  EventType = "typing_stop"

	// User status events
	EventUserOnline  EventType = "user_online"
	EventUserOffline EventType = "user_offline"
	EventUserList    EventType = "user_list"

	// System events
	EventError        EventType = "error"
	EventConnected    EventType = "connected"
	EventDisconnected EventType = "disconnected"
	EventPing         EventType = "ping"
	EventPong         EventType = "pong"
)

// Event represents a WebSocket event
type Event struct {
	Type      EventType   `json:"type"`
	Data      interface{} `json:"data"`
	Timestamp string      `json:"timestamp"`
	UserID    string      `json:"user_id,omitempty"`
}

// MessageEvent represents a new message event
type MessageEvent struct {
	Message interface{} `json:"message"`
}

// TypingEvent represents typing start/stop events
type TypingEvent struct {
	UserID       string `json:"user_id"`
	UserNickname string `json:"user_nickname"`
	ReceiverID   string `json:"receiver_id"`
}
