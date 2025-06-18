# Real Time Forum

## Overview

The real_time_forum is a single-page application (SPA) with a Go backend and a vanilla JavaScript, HTML, and CSS frontend. The backend handles user authentication, post/comment management, and real-time private messaging via WebSockets. SQLite stores all persistent data, and the application uses Gorilla WebSocket for real-time communication. The architecture follows a modular design, separating concerns like database operations, WebSocket handling, and HTTP API endpoints.

## File Structure Explanation

The project is organized to promote modularity, maintainability, and scalability. Below is the file structure with explanations for each directory and file:

```bash
real_time_forum/
├── backend/
│   ├── cmd/
│   │   └── main.go                  # Entry point for the Go server, initializes HTTP and WebSocket servers
│   ├── internal/
│   │   ├── api/
│   │   │   ├── handlers.go          # HTTP handlers for REST endpoints (e.g., /register, /login, /posts)
│   │   │   └── middleware.go        # Middleware for authentication, session validation, and request logging
│   │   ├── database/
│   │   │   ├── db.go                # Initializes SQLite connection and runs migrations
│   │   │   ├── user.go              # Database operations for users (e.g., create, authenticate)
│   │   │   ├── post.go              # Database operations for posts and comments
│   │   │   └── message.go           # Database operations for private messages
│   │   ├── models/
│   │   │   ├── user.go              # User struct and methods (e.g., validation)
│   │   │   ├── post.go              # Post and comment structs
│   │   │   └── message.go           # Message struct for private messages
│   │   ├── websocket/
│   │   │   ├── manager.go           # Manages WebSocket clients and event handlers
│   │   │   ├── client.go            # Represents a WebSocket client with connection and egress channel
│   │   │   ├── event.go             # Defines event struct for WebSocket messages
│   │   │   └── handlers.go          # Handles specific WebSocket events (e.g., message, user_status)
│   │   └── utils/
│   │       └── session.go           # Manages session tokens and cookies
│   ├── go.mod                       # Go module file for dependency management
│   └── go.sum                       # Checksum for Go dependencies
├── frontend/
│   ├── static/
│   │   ├── css/
│   │   │   └── styles.css           # Styles for the SPA (e.g., layout, post feed, chat UI)
│   │   ├── js/
│   │   │   ├── main.js              # Main JS for initializing SPA and WebSocket client
│   │   │   ├── auth.js              # Handles registration, login, and logout
│   │   │   ├── posts.js             # Manages post creation, commenting, and feed display
│   │   │   └── messages.js          # Handles private messaging UI and WebSocket events
│   │   └── index.html               # Single HTML file for the SPA
├── migrations/
│   └── 001_init.sql                 # SQLite schema for users, posts, comments, messages, and sessions
└── README.md                        # Project overview, setup instructions, and usage
```

- **backend/cmd/server/main.go:** The entry point initializes the SQLite database, sets up the HTTP server (using net/http), and starts the WebSocket manager. It binds API routes and WebSocket endpoints.

    - **api/:** Handles HTTP requests for REST endpoints (e.g., user registration, post creation) and middleware for authentication.

    - **database/:** Manages SQLite connections and CRUD operations for users, posts, comments, and messages.

    - **models/:** Defines data structures (structs) and validation logic for users, posts, and messages.

    - **websocket/**: Implements real-time functionality using the Manager, Client, and Event architecture for private messages and user status updates.
    - **utils/:** Contains utilities like session management for handling cookies and tokens.
- **frontend/static/:** Contains the SPA's assets:
    - **css/:** Styles the UI, including responsive layouts for the post feed and chat.
    - **js/:** Manages frontend logic, including DOM manipulation, WebSocket communication, and event handling (e.g., throttle/debounce for message scrolling).
    - **index.html:** The single HTML file serving the SPA, with dynamic content managed by JavaScript.
- **migrations/:** Stores SQL scripts for initializing and updating the SQLite database schema.
- **README.md:** Documents setup, running the server, and contributing guidelines.

### Project Architecture
- **Backend:**
    - **HTTP Server:** Uses net/http to serve REST endpoints for authentication, posts, and message history. Middleware validates sessions using cookies.
    - **WebSocket Server:** Uses Gorilla WebSocket to handle real-time communication. The Manager struct tracks connected clients, routes events (e.g., private messages), and broadcasts user status updates.
    - **Database:** SQLite stores user data, posts, comments, messages, and sessions. A connection pool ensures efficient query handling.
    - **Session Management:** Uses cookies with secure tokens stored in the sessions table to authenticate users.
- **Frontend:**

    - A single HTML page (index.html) serves as the SPA, with JavaScript dynamically rendering views (e.g., login, post feed, chat).
    - WebSocket client connects to the backend to send/receive real-time messages and user status updates.
    - JavaScript handles pagination for message history (loading 10 messages at a time) with throttling to optimize scrolling.

- **Real-Time Features:**

    - Private messages are sent via WebSocket and stored in the database.
    - User online/offline status is broadcast to update the chat sidebar in real time.

- **Security:**

    - Passwords are hashed with **bcrypt**.
    - Session tokens use UUIDs for uniqueness.
    - WebSocket messages are validated to prevent malformed data.