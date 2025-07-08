package websocket

import "time"

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
	EventUserStats   EventType = "user_stats"

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

// UserStatusEvent represents user online/offline events
type UserStatusEvent struct {
	UserStatus interface{} `json:"user_status"`
}

// UserListEvent represents the list of online users
type UserListEvent struct {
	Users []interface{} `json:"users"`
}

// ErrorEvent represents error events
type ErrorEvent struct {
	Message string `json:"message"`
	Code    int    `json:"code,omitempty"`
}

// ConnectedEvent represents successful connection
type ConnectedEvent struct {
	UserID  string `json:"user_id"`
	Message string `json:"message"`
}

// MessageReadEvent represents message read confirmation
type MessageReadEvent struct {
	SenderID   string   `json:"sender_id"`
	ReceiverID string   `json:"receiver_id"`
	MessageIDs []string `json:"message_ids,omitempty"`
}

// UserStatsEvent represents user statistics
type UserStatsEvent struct {
	TotalUsers   int `json:"total_users"`
	OnlineUsers  int `json:"online_users"`
	OfflineUsers int `json:"offline_users"`
}

// CreateEvent creates a new WebSocket event
func CreateEvent(eventType EventType, data interface{}, userID string) *Event {
	return &Event{
		Type:      eventType,
		Data:      data,
		Timestamp: time.Now().Format("2006-01-02T15:04:05Z07:00"),
		UserID:    userID,
	}
}

// CreateErrorEvent creates an error event
func CreateErrorEvent(message string, code int) *Event {
	return CreateEvent(EventError, &ErrorEvent{
		Message: message,
		Code:    code,
	}, "")
}

// CreateConnectedEvent creates a connected event
func CreateConnectedEvent(userID string) *Event {
	return CreateEvent(EventConnected, &ConnectedEvent{
		UserID:  userID,
		Message: "Successfully connected to WebSocket",
	}, userID)
}

// CreateMessageEvent creates a new message event
func CreateMessageEvent(message interface{}) *Event {
	return CreateEvent(EventNewMessage, &MessageEvent{
		Message: message,
	}, "")
}
