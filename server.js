const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Models
const Message = require('./models/Message');

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/whatsapp-clone', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// REST API to get messages
app.get('/messages', async (req, res) => {
  const messages = await Message.find().sort({ createdAt: 1 });
  res.json(messages);
});

// REST API to post a new message
app.post('/messages', async (req, res) => {
  const { user, message } = req.body;
  const msg = new Message({ user, message });
  await msg.save();
  res.json(msg);
  io.emit('message', msg); // Broadcast to all clients
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('send-message', async (data) => {
    const msg = new Message(data);
    await msg.save();
    io.emit('message', msg);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(5000, () => console.log('Server started on port 5000'));