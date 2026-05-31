require('./config/dns');
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/database');

// Connect to database
// connectDB() is called inside an async initialization function below

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Smart Guide Management System API is running...',
    version: '1.0.0',
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/guides', require('./routes/guides'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/packages', require('./routes/packages'));
app.use('/api/emergency', require('./routes/emergency'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/forum', require('./routes/forum'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/uploads', require('./routes/uploads'));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user's personal room
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Join chat room
  socket.on('join-chat', (chatId) => {
    socket.join(`chat-${chatId}`);
    console.log(`User joined chat: ${chatId}`);
  });

  // Join group chat
  socket.on('join-group', (groupId) => {
    socket.join(`group-${groupId}`);
    console.log(`User joined group: ${groupId}`);
  });

  // Handle new message
  socket.on('send-message', (data) => {
    socket.to(`chat-${data.chatId}`).emit('receive-message', data);
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    socket.to(`chat-${data.chatId}`).emit('user-typing', data);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      const emailStatus = process.env.EMAIL_ENABLED === 'true'
        ? `ENABLED (${process.env.EMAIL_USER})`
        : 'DISABLED (dev fallback — link shown on screen)';
      console.log(`Email: ${emailStatus}`);
    });
    
    // Handle server errors (like EADDRINUSE)
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Error: Port ${PORT} is already in use.`);
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
