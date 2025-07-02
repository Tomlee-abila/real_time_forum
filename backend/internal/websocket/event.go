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
