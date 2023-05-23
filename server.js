// server.js

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require("body-parser");

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan("tiny"));

// Chatroom data
const chatRooms = [];

io.on("connection", (socket) => {
  console.log("A user connected");

  // Create a new chatroom
  socket.on("create room", (roomName) => {
    const roomId = Date.now().toString();
    const newRoom = {
      roomId,
      roomName,
      messages: [],
    };
    chatRooms.push(newRoom);
    socket.join(roomId);
    socket.emit("room created", newRoom);
    io.emit("room list updated", chatRooms);
  });

  // Join a chatroom
  socket.on("join room", (roomId) => {
    socket.join(roomId);
    const room = chatRooms.find((room) => room.roomId === roomId);
    if (room) {
      socket.emit("room joined", room);
    }
  });

  // Leave a chatroom
  socket.on("leave room", (roomId) => {
    socket.leave(roomId);
    socket.emit("room left");
  });

  // Send a chat message
  socket.on("send message", (messageData) => {
    const { roomId, senderName, message } = messageData;
    const room = chatRooms.find((room) => room.roomId === roomId);
    if (room) {
      const newMessage = { senderName, message };
      room.messages.push(newMessage);
      io.to(roomId).emit("new message", newMessage);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

const port = 8080;
http.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
