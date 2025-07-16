# Real Time Forum

## Overview

The real_time_forum is a single-page application (SPA) with a Go backend and a vanilla JavaScript, HTML, and CSS frontend. The backend handles user authentication, post/comment management, and real-time private messaging via WebSockets. SQLite stores all persistent data, and the application uses Gorilla WebSocket for real-time communication. The architecture follows a modular design, separating concerns like database operations, WebSocket handling, and HTTP API endpoints.

## File Structure Explanation

The project is organized to promote modularity, maintainability, and scalability. Below is the comprehensive file structure with explanations for each directory and file:

```bash
real_time_forum/
├── backend/                         # Go backend server
│   ├── cmd/
│   │   └── main.go                  # Entry point: initializes database, HTTP server, and WebSocket hub
│   └── internal/                    # Internal backend packages (not importable by external modules)
│       ├── api/
│       │   ├── handlers.go          # HTTP handlers for all REST endpoints and WebSocket upgrade
│       │   └── middleware.go        # Authentication middleware and request validation
│       ├── database/
│       │   ├── db.go                # Database initialization, connection management, and migrations
│       │   ├── user.go              # User CRUD operations, authentication, and session management
│       │   ├── post.go              # Post and comment database operations with filtering/pagination
│       │   └── message.go           # Private message storage, retrieval, and conversation management
│       ├── models/
│       │   ├── user.go              # User data structures, validation, and business logic
│       │   ├── post.go              # Post and comment models with category validation
│       │   └── message.go           # Message models for real-time communication
│       ├── utils/
│       │   └── session.go           # Session token generation, validation, and cookie management
│       └── websocket/
│           ├── manager.go           # WebSocket hub: manages clients, broadcasting, and user tracking
│           ├── client.go            # Individual WebSocket client with read/write pumps and heartbeat
│           ├── event.go             # WebSocket event types and message structure definitions
│           └── handlers.go          # WebSocket upgrade handler and authentication
├── frontend/                        # Frontend single-page application
│   └── static/
│       ├── css/
│       │   ├── style.css            # Main application styles and responsive design
│       │   └── styles.css           # Additional styling components
│       ├── js/
│       │   ├── main.js              # Application initialization and global utilities
│       │   ├── auth.js              # Authentication: login, logout, session management, user stats
│       │   ├── posts.js             # Post management: creation, display, commenting, filtering
│       │   ├── messages.js          # Real-time messaging: WebSocket events, chat UI, conversations
│       │   └── websocket.js         # WebSocket client: connection management, heartbeat, reconnection
│       ├── templates/               # HTML templates for different views
│       │   ├── home.html            # Main forum view with posts and messaging
│       │   ├── login.html           # User login form
│       │   └── signup.html          # User registration form
│       └── index.html               # Main SPA entry point with dynamic content loading
├── migrations/                      # Database schema migrations
│   ├── 001_init.sql                 # Initial schema: users, posts, comments, messages, sessions
│   └── 002_add_user_status.sql      # User status tracking for online/offline functionality
├── go.mod                           # Go module dependencies and version management
├── go.sum                           # Dependency checksums for security and reproducibility
├── forum.db                         # SQLite database file (created at runtime)
├── real_time_forum                  # Compiled binary executable
└── README.md                        # Project documentation and setup instructions
```

### Detailed Component Explanations

#### Backend Components

- **`backend/cmd/main.go`**: Application entry point that orchestrates the entire server startup:
  - Initializes SQLite database and runs migrations
  - Creates and starts the WebSocket hub for real-time communication
  - Sets up HTTP routes and middleware
  - Configures the server to listen on port 8080

- **`backend/internal/api/`**: HTTP API layer handling REST endpoints:
  - **`handlers.go`**: Comprehensive HTTP handlers for all endpoints including user authentication, post management, messaging APIs, and WebSocket upgrade
  - **`middleware.go`**: Authentication middleware for session validation and request processing

- **`backend/internal/database/`**: Data persistence layer with SQLite operations:
  - **`db.go`**: Database connection management, initialization, and migration execution
  - **`user.go`**: User operations including registration, authentication, session management, and online user tracking
  - **`post.go`**: Post and comment CRUD operations with category filtering and pagination support
  - **`message.go`**: Private messaging system with conversation management and message history

- **`backend/internal/models/`**: Data models and business logic:
  - **`user.go`**: User struct with validation for registration, login, and profile management
  - **`post.go`**: Post and comment models with category validation and content structure
  - **`message.go`**: Message models for real-time communication with sender/receiver relationships

- **`backend/internal/utils/`**: Utility functions and helpers:
  - **`session.go`**: Session token generation, validation, cookie management, and security utilities

- **`backend/internal/websocket/`**: Real-time communication infrastructure:
  - **`manager.go`**: WebSocket hub managing client connections, message broadcasting, and user presence tracking
  - **`client.go`**: Individual client connection handling with read/write pumps, heartbeat mechanism, and connection lifecycle
  - **`event.go`**: WebSocket event type definitions and message structure for real-time communication
  - **`handlers.go`**: WebSocket connection upgrade, authentication, and initial client setup

#### Frontend Components

- **`frontend/static/index.html`**: Single-page application entry point with dynamic content areas and template loading

- **`frontend/static/templates/`**: HTML templates for different application views:
  - **`home.html`**: Main forum interface with post feed and messaging sidebar
  - **`login.html`**: User authentication form with validation
  - **`signup.html`**: User registration form with field validation

- **`frontend/static/css/`**: Styling and responsive design:
  - **`style.css`**: Main application styles, layout, and responsive design
  - **`styles.css`**: Additional component-specific styling

- **`frontend/static/js/`**: Frontend application logic:
  - **`main.js`**: Application initialization, global utilities, and component coordination
  - **`auth.js`**: Authentication management including login, logout, session handling, user statistics, and periodic data refresh
  - **`posts.js`**: Post management including creation, display, commenting, filtering, and pagination
  - **`messages.js`**: Real-time messaging system with WebSocket event handling, conversation management, and chat UI
  - **`websocket.js`**: WebSocket client with connection management, heartbeat, automatic reconnection, and error handling

#### Database and Configuration

- **`migrations/`**: Database schema evolution:
  - **`001_init.sql`**: Initial database schema with users, posts, comments, messages, and sessions tables
  - **`002_add_user_status.sql`**: User status tracking for online/offline functionality

- **`go.mod` & `go.sum`**: Go module dependency management with version control and security checksums

- **`forum.db`**: SQLite database file created at runtime containing all application data

- **`real_time_forum`**: Compiled binary executable ready for deployment

### Project Architecture

#### Backend Architecture
- **HTTP Server (net/http):**
  - RESTful API endpoints for authentication, post management, and message history
  - Session-based authentication using secure cookies
  - Middleware for request validation and user authorization
  - Static file serving for frontend assets

- **WebSocket Server (Gorilla WebSocket):**
  - Real-time communication hub with client connection management
  - Event-driven architecture for message broadcasting
  - Heartbeat mechanism (ping/pong) for connection health monitoring
  - Automatic cleanup of disconnected clients and duplicate connection handling
  - User presence tracking for online/offline status

- **Database Layer (SQLite):**
  - Persistent storage for users, posts, comments, messages, and sessions
  - Migration system for schema evolution
  - Optimized queries with proper indexing
  - Transaction support for data consistency

- **Session Management:**
  - Secure token generation using UUIDs and cryptographic randomness
  - Cookie-based session storage with configurable expiration (24 hours)
  - Session cleanup and validation mechanisms

#### Frontend Architecture
- **Single-Page Application (SPA):**
  - Dynamic view rendering using vanilla JavaScript
  - Template-based UI with modular HTML components
  - Responsive design supporting desktop and mobile devices
  - Client-side routing and state management

- **WebSocket Client:**
  - Automatic connection management with reconnection logic
  - Heartbeat response handling for connection stability
  - Event-driven message processing
  - Connection state management preventing multiple simultaneous connections

- **Modular JavaScript Architecture:**
  - Separation of concerns: authentication, posts, messaging, WebSocket handling
  - Event-driven communication between modules
  - Periodic data refresh for real-time statistics
  - Error handling and user feedback systems

#### Real-Time Features
- **Private Messaging:**
  - WebSocket-based real-time message delivery
  - Message persistence in database
  - Conversation management with message history
  - Pagination support (10 messages per page) with infinite scroll

- **User Presence System:**
  - Real-time online/offline status tracking
  - WebSocket connection-based presence detection
  - User statistics with live updates
  - Automatic cleanup on disconnection

- **Live Updates:**
  - Real-time user count updates
  - Instant message delivery and read receipts
  - Dynamic online user list with nicknames
  - Connection status indicators

#### Security Features
- **Authentication & Authorization:**
  - Password hashing using bcrypt with salt
  - Secure session token generation and validation
  - Cookie-based authentication with HttpOnly flags
  - Session expiration and cleanup

- **Data Validation:**
  - Input sanitization and validation on both client and server
  - WebSocket message validation to prevent malformed data
  - SQL injection prevention using parameterized queries
  - XSS protection through proper data encoding

- **Connection Security:**
  - WebSocket authentication before connection establishment
  - Graceful connection handling and cleanup
  - Rate limiting and connection abuse prevention
  - Secure cookie configuration for production deployment
