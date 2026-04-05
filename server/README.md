# Smart Guide Management System - Backend Server

## Overview
This is the backend server for the Smart Guide Management System (SGMS), a web-based platform connecting tourists with verified guides in Nepal.

## Features
- User Authentication (Tourist, Guide, Admin)
- Guide Verification System
- Booking Management
- Package Management
- Group Creation and Management
- Real-time Chat (Socket.io)
- Admin Dashboard and Analytics
- Payment Integration (eSewa)

## Technology Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.io
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the server directory (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update the `.env` file with your configuration:
   - MongoDB connection string
   - JWT secret key
   - eSewa credentials (if using payment gateway)
   - Email configuration (for notifications)

4. Start the server:
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)

### Guides
- `GET /api/guides` - Get all verified guides (with filters)
- `GET /api/guides/:id` - Get single guide profile
- `PUT /api/guides/profile` - Update guide profile (Protected - Guide only)
- `GET /api/guides/:id/packages` - Get guide's packages
- `GET /api/guides/:id/reviews` - Get guide's reviews

### Packages
- `GET /api/packages` - Get all active packages (with filters)
- `GET /api/packages/:id` - Get single package
- `POST /api/packages` - Create new package (Protected - Guide only)
- `PUT /api/packages/:id` - Update package (Protected - Guide owner)
- `DELETE /api/packages/:id` - Delete package (Protected - Guide owner)

### Bookings
- `POST /api/bookings` - Create new booking (Protected - Tourist)
- `GET /api/bookings` - Get user's bookings (Protected)
- `GET /api/bookings/:id` - Get single booking (Protected)
- `PUT /api/bookings/:id/status` - Update booking status (Protected)
- `POST /api/bookings/:id/review` - Add review (Protected - Tourist)

### Groups
- `POST /api/groups` - Create new group (Protected - Tourist)
- `GET /api/groups` - Get groups (Protected)
- `GET /api/groups/:id` - Get single group (Protected)
- `POST /api/groups/:id/join` - Join group (Protected)
- `POST /api/groups/:id/leave` - Leave group (Protected)

### Admin
- `GET /api/admin/dashboard` - Get dashboard statistics (Protected - Admin only)
- `GET /api/admin/guides/pending` - Get pending verifications (Protected - Admin only)
- `PUT /api/admin/guides/:id/verify` - Verify guide (Protected - Admin only)
- `GET /api/admin/bookings` - Get all bookings (Protected - Admin only)
- `PUT /api/admin/bookings/:id/dispute` - Handle dispute (Protected - Admin only)
- `GET /api/admin/users` - Get all users (Protected - Admin only)
- `PUT /api/admin/users/:id/status` - Activate/Deactivate user (Protected - Admin only)

## Socket.io Events

### Client to Server
- `join-user-room` - Join user's personal notification room
- `join-chat` - Join a chat room
- `join-group` - Join a group chat
- `send-message` - Send a message
- `typing` - Send typing indicator

### Server to Client
- `new-booking` - New booking notification
- `booking-updated` - Booking status update
- `verification-approved` - Guide verification approved
- `receive-message` - Receive new message
- `user-typing` - User typing indicator
- `member-joined` - New member joined group
- `member-left` - Member left group

## Database Models

### User
- Supports three roles: tourist, guide, admin
- Guide-specific profile with verification
- Gamification (points, badges)

### Booking
- Links tourist and guide
- Payment tracking
- Review and rating system

### Package
- Created by guides
- Includes itinerary, pricing, difficulty

### Group
- Created by tourists
- Member management
- Group chat support

### Chat & Message
- Private and group chats
- Media sharing support

## Environment Variables

See `.env.example` for all required environment variables.

## Development

The server runs on port 5000 by default (configurable via PORT in .env).

For development with auto-reload:
```bash
npm run dev
```

## Security

- Passwords are hashed using bcryptjs
- JWT tokens for authentication
- Role-based access control
- Input validation using express-validator

## License

ISC

