require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const http = require('http');
const socketIO = require('socket.io');
const moment = require('moment');
const marked = require('marked');
const interviewRoutes = require('./routes/interview');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const port = process.env.PORT || 3000;

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'interview-coach-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Custom middleware for template utilities
app.use((req, res, next) => {
    res.locals.moment = moment;
    res.locals.marked = marked;
    next();
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('startInterview', (data) => {
        socket.join(`interview-${socket.id}`);
        socket.emit('interviewStarted', { sessionId: socket.id });
    });

    socket.on('submitAnswer', (data) => {
        // Broadcast typing indicator
        socket.to(`interview-${socket.id}`).emit('processingAnswer');
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Make io accessible to routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routes
app.get('/', (req, res) => {
    res.render('index', {
        user: req.session.user,
        interviewHistory: req.session.interviewHistory || []
    });
});

app.use('/interview', interviewRoutes);

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { 
        error: err,
        user: req.session.user
    });
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 