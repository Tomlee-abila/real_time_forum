package database

import (
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
