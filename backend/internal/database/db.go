package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

func Init() {
	var openErr error

	DB, openErr = sql.Open("sqlite3", "forum.db")

	if openErr != nil {
		log.Fatalf("Failed to open database: %v", openErr)
	}

	DB.SetMaxOpenConns(10) //allow up to 10 concurrent connections
	DB.SetMaxIdleConns(5)
	DB.SetConnMaxLifetime(0)

	//Test the connection
	if pingErr := DB.Ping(); pingErr != nil {
		log.Fatalf("Failed to connect to database: %v", pingErr)
	}

	//Run migrations
	migrations := []string{
		"migrations/001_init.sql",
		"migrations/002_add_user_status.sql",
	}

	for _, migrationFile := range migrations {
		if migrateErr := runMigrations(migrationFile); migrateErr != nil {
			log.Fatalf("Failed to run migration %s: %v", migrationFile, migrateErr)
		}
	}

	log.Println("Database initialized and migrations applied successfully.")
}

func runMigrations(filepath string) error {

	content, readErr := os.ReadFile(filepath)
	if readErr != nil {
		return fmt.Errorf("failed to read migration file: %w", readErr)
	}

	_, execErr := DB.Exec(string(content))
	if execErr != nil {
		return fmt.Errorf("migration execution failed: %w", execErr)
	}
	return nil
}
