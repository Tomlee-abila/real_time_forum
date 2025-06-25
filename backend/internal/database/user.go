package database

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/Tomlee-abila/real_time_forum/backend/internal/models"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// GetUserByEmailOrNickname retrieves a user by email or nickname
func GetUserByEmailOrNickname(emailOrNickname string) (*models.User, error) {
	query := `
		SELECT id, nickname, age, gender, first_name, last_name, email, password, created_at
		FROM users
		WHERE email = ? OR nickname = ?
	`

	var user models.User
	err := DB.QueryRow(query, emailOrNickname, emailOrNickname).Scan(
		&user.ID,
		&user.Nickname,
		&user.Age,
		&user.Gender,
		&user.FirstName,
		&user.LastName,
		&user.Email,
		&user.Password,
		&user.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("error querying user: %w", err)
	}

	return &user, nil
}

// VerifyPassword compares a plaintext password with a hashed password
func VerifyPassword(hashedPassword, plainPassword string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(plainPassword))
}

// CreateUser creates a new user in the database
func CreateUser(user *models.User) error {
	// Generate UUID for user
	user.ID = uuid.New().String()
	user.CreatedAt = time.Now()

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("error hashing password: %w", err)
	}

	query := `
		INSERT INTO users (id, nickname, age, gender, first_name, last_name, email, password, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	_, err = DB.Exec(query,
		user.ID,
		user.Nickname,
		user.Age,
		user.Gender,
		user.FirstName,
		user.LastName,
		user.Email,
		string(hashedPassword),
		user.CreatedAt,
	)

	if err != nil {
		return fmt.Errorf("error creating user: %w", err)
	}

	return nil
}