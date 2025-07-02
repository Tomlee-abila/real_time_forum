package database

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/Tomlee-abila/real_time_forum/backend/internal/models"
	"github.com/google/uuid"
)

// CreateMessage creates a new private message
func CreateMessage(senderID string, message *models.MessageCreation) (*models.Message, error) {
	messageID := uuid.New().String()
	createdAt := time.Now()

	// Check if receiver exists
	_, err := GetUserByID(message.ReceiverID)
	if err != nil {
		return nil, fmt.Errorf("receiver not found")
	}

	query := `
        INSERT INTO messages (id, sender_id, receiver_id, content, created_at, is_read)
        VALUES (?, ?, ?, ?, ?, ?)
    `

	_, err = DB.Exec(query, messageID, senderID, message.ReceiverID, message.Content, createdAt, false)
	if err != nil {
		return nil, fmt.Errorf("failed to create message: %w", err)
	}

	// Get sender and receiver info for response
	sender, err := GetUserByID(senderID)
	if err != nil {
		return nil, fmt.Errorf("failed to get sender info: %w", err)
	}

	receiver, err := GetUserByID(message.ReceiverID)
	if err != nil {
		return nil, fmt.Errorf("failed to get receiver info: %w", err)
	}

	return &models.Message{
		ID:               messageID,
		SenderID:         senderID,
		ReceiverID:       message.ReceiverID,
		Content:          message.Content,
		CreatedAt:        createdAt,
		IsRead:           false,
		SenderNickname:   sender.Nickname,
		ReceiverNickname: receiver.Nickname,
	}, nil
}

// GetMessageHistory retrieves paginated message history between two users
func GetMessageHistory(userID1, userID2 string, limit, offset int) (*models.MessageHistory, error) {
	// Get messages between the two users
	query := `
        SELECT 
            m.id, m.sender_id, m.receiver_id, m.content, m.created_at, m.is_read,
            s.nickname as sender_nickname, r.nickname as receiver_nickname
        FROM messages m
        LEFT JOIN users s ON m.sender_id = s.id
        LEFT JOIN users r ON m.receiver_id = r.id
        WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?
    `

	rows, err := DB.Query(query, userID1, userID2, userID2, userID1, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get message history: %w", err)
	}
	defer rows.Close()

	var messages []models.Message
	for rows.Next() {
		var message models.Message
		err := rows.Scan(
			&message.ID, &message.SenderID, &message.ReceiverID, &message.Content,
			&message.CreatedAt, &message.IsRead, &message.SenderNickname, &message.ReceiverNickname,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan message: %w", err)
		}
		messages = append(messages, message)
	}

	// Reverse the order to show oldest first (since we queried DESC for pagination)
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	// Get total count
	totalCount, err := GetMessageCount(userID1, userID2)
	if err != nil {
		return nil, fmt.Errorf("failed to get message count: %w", err)
	}

	// Check if there are more messages
	hasMore := offset+len(messages) < totalCount

	return &models.MessageHistory{
		Messages:    messages,
		HasMore:     hasMore,
		TotalCount:  totalCount,
		CurrentPage: (offset / limit) + 1,
	}, nil
}

// GetConversations retrieves all conversations for a user
func GetConversations(userID string) ([]models.Conversation, error) {
	query := `
        SELECT DISTINCT
            CASE 
                WHEN m.sender_id = ? THEN m.receiver_id 
                ELSE m.sender_id 
            END as other_user_id,
            u.nickname as other_user_nickname,
            us.is_online,
            us.last_seen
        FROM messages m
        LEFT JOIN users u ON (
            CASE 
                WHEN m.sender_id = ? THEN m.receiver_id = u.id
                ELSE m.sender_id = u.id
            END
        )
        LEFT JOIN user_status us ON u.id = us.user_id
        WHERE m.sender_id = ? OR m.receiver_id = ?
        ORDER BY (
            SELECT MAX(created_at) 
            FROM messages m2 
            WHERE (m2.sender_id = ? AND m2.receiver_id = other_user_id) 
               OR (m2.sender_id = other_user_id AND m2.receiver_id = ?)
        ) DESC
    `

	rows, err := DB.Query(query, userID, userID, userID, userID, userID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get conversations: %w", err)
	}
	defer rows.Close()

	var conversations []models.Conversation
	for rows.Next() {
		var conv models.Conversation
		var lastSeen sql.NullTime

		err := rows.Scan(&conv.UserID, &conv.UserNickname, &conv.IsOnline, &lastSeen)
		if err != nil {
			return nil, fmt.Errorf("failed to scan conversation: %w", err)
		}

		if lastSeen.Valid {
			conv.LastSeen = lastSeen.Time
		}

		// Get last message
		lastMessage, err := GetLastMessage(userID, conv.UserID)
		if err == nil {
			conv.LastMessage = lastMessage
		}

		// Get unread count
		unreadCount, err := GetUnreadMessageCount(userID, conv.UserID)
		if err == nil {
			conv.UnreadCount = unreadCount
		}

		conversations = append(conversations, conv)
	}

	return conversations, nil
}

// GetLastMessage gets the last message between two users
func GetLastMessage(userID1, userID2 string) (*models.Message, error) {
	query := `
        SELECT 
            m.id, m.sender_id, m.receiver_id, m.content, m.created_at, m.is_read,
            s.nickname as sender_nickname, r.nickname as receiver_nickname
        FROM messages m
        LEFT JOIN users s ON m.sender_id = s.id
        LEFT JOIN users r ON m.receiver_id = r.id
        WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.created_at DESC
        LIMIT 1
    `

	var message models.Message
	err := DB.QueryRow(query, userID1, userID2, userID2, userID1).Scan(
		&message.ID, &message.SenderID, &message.ReceiverID, &message.Content,
		&message.CreatedAt, &message.IsRead, &message.SenderNickname, &message.ReceiverNickname,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("no messages found")
		}
		return nil, fmt.Errorf("failed to get last message: %w", err)
	}

	return &message, nil
}

// MarkMessagesAsRead marks all messages from a specific user as read
func MarkMessagesAsRead(receiverID, senderID string) error {
	query := `
        UPDATE messages 
        SET is_read = true 
        WHERE receiver_id = ? AND sender_id = ? AND is_read = false
    `

	_, err := DB.Exec(query, receiverID, senderID)
	if err != nil {
		return fmt.Errorf("failed to mark messages as read: %w", err)
	}

	return nil
}

// GetUnreadMessageCount gets the count of unread messages from a specific user
func GetUnreadMessageCount(receiverID, senderID string) (int, error) {
	query := `
        SELECT COUNT(*) 
        FROM messages 
        WHERE receiver_id = ? AND sender_id = ? AND is_read = false
    `

	var count int
	err := DB.QueryRow(query, receiverID, senderID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to get unread message count: %w", err)
	}

	return count, nil
}

// GetMessageCount gets the total count of messages between two users
func GetMessageCount(userID1, userID2 string) (int, error) {
	query := `
        SELECT COUNT(*) 
        FROM messages 
        WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
    `

	var count int
	err := DB.QueryRow(query, userID1, userID2, userID2, userID1).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to get message count: %w", err)
	}

	return count, nil
}

// UpdateUserStatus updates or creates user online status
func UpdateUserStatus(userID string, isOnline bool) error {
	now := time.Now()

	query := `
        INSERT OR REPLACE INTO user_status (user_id, is_online, last_seen, last_active)
        VALUES (?, ?, ?, ?)
    `

	_, err := DB.Exec(query, userID, isOnline, now, now)
	if err != nil {
		return fmt.Errorf("failed to update user status: %w", err)
	}

	return nil
}

// GetUserStatus gets the online status of a user
func GetUserStatus(userID string) (*models.UserStatus, error) {
	query := `
        SELECT us.user_id, u.nickname, us.is_online, us.last_seen, us.last_active
        FROM user_status us
        LEFT JOIN users u ON us.user_id = u.id
        WHERE us.user_id = ?
    `

	var status models.UserStatus
	err := DB.QueryRow(query, userID).Scan(
		&status.UserID, &status.Nickname, &status.IsOnline, &status.LastSeen, &status.LastActive,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			// User status doesn't exist, create default
			user, err := GetUserByID(userID)
			if err != nil {
				return nil, fmt.Errorf("user not found")
			}
			return &models.UserStatus{
				UserID:     userID,
				Nickname:   user.Nickname,
				IsOnline:   false,
				LastSeen:   time.Now(),
				LastActive: time.Now(),
			}, nil
		}
		return nil, fmt.Errorf("failed to get user status: %w", err)
	}

	return &status, nil
}

// GetAllOnlineUsers gets all currently online users
func GetAllOnlineUsers() ([]models.UserStatus, error) {
	query := `
        SELECT us.user_id, u.nickname, us.is_online, us.last_seen, us.last_active
        FROM user_status us
        LEFT JOIN users u ON us.user_id = u.id
        WHERE us.is_online = true
        ORDER BY u.nickname ASC
    `

	rows, err := DB.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to get online users: %w", err)
	}
	defer rows.Close()

	var users []models.UserStatus
	for rows.Next() {
		var user models.UserStatus
		err := rows.Scan(&user.UserID, &user.Nickname, &user.IsOnline, &user.LastSeen, &user.LastActive)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user status: %w", err)
		}
		users = append(users, user)
	}

	return users, nil
}
