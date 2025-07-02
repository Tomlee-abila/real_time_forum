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
