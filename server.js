require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/authRoutes");
const projectRoutes = require("./src/routes/projectRoutes");
const taskRoutes = require("./src/routes/taskRoutes");
const messageRoutes = require("./src/routes/messageRoutes");
const Message = require("./src/models/Message");
const dashboardRoutes = require("./src/routes/dashboard");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "https://task-frontend-ez1c.vercel.app" } });

app.use(cors({
    origin: "https://task-frontend-ez1c.vercel.app",
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use("/auth", authRoutes);
app.use("/project", projectRoutes);
app.use("/tasks", taskRoutes);
app.use("/messages", messageRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/dashboard", dashboardRoutes);

const activeUsers = new Map();

io.on("connection", (socket) => {
    console.log(`✅ User connected (Socket ID: ${socket.id})`);

    socket.on("userConnected", (userId) => {
        activeUsers.set(userId, socket.id);
    });

    // Handle sending messages
    socket.on("sendMessage", async ({ sender, receiver, message }) => {
        try {
            const newMessage = new Message({ sender, receiver, message, isRead: false });
            await newMessage.save();
    
            const savedMessage = await Message.findById(newMessage._id).populate("sender receiver", "name _id");
    
            const receiverSocket = activeUsers.get(receiver);
            if (receiverSocket) {
                io.to(receiverSocket).emit("receiveMessage", savedMessage);
            }
    
            const senderSocket = activeUsers.get(sender);
            if (senderSocket) {
                io.to(senderSocket).emit("receiveMessage", savedMessage);
            }
        } catch (error) {
            console.error("❌ Message saving error:", error);
        }
    });

    // ✅ Handle Outgoing Call Request
    socket.on("callUser", ({ from, to, signalData }) => {
        const receiverSocket = activeUsers.get(to);
        if (receiverSocket) {
            io.to(receiverSocket).emit("incomingCall", { from, signalData });
        }
    });

    // ✅ Handle Call Acceptance
    socket.on("acceptCall", ({ to, signalData }) => {
        const callerSocket = activeUsers.get(to);
        if (callerSocket) {
            io.to(callerSocket).emit("callAccepted", signalData);
        }
    });

    socket.on("disconnect", () => {
        activeUsers.forEach((socketId, userId) => {
            if (socketId === socket.id) {
                activeUsers.delete(userId);
                console.log(`❌ User disconnected: ${userId}`);
            }
        });
    });

    socket.on("endCall", ({ to }) => {
        const receiverSocket = activeUsers.get(to);
        if (receiverSocket) {
            io.to(receiverSocket).emit("callEnded");
        }
    });
});

const PORT = process.env.PORT || 5000;

connectDB();
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
