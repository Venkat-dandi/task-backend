const express = require("express");
const { authMiddleware } = require("../middlewares/authMiddleware");
const Message = require("../models/Message");

const router = express.Router();

router.get("/unread", authMiddleware, async (req, res) => {
  try {
    const loggedInUserId = req.user._id || req.user.id; // Get logged-in user ID

    // Find unread messages and group by sender
    const unreadMessages = await Message.aggregate([
      { $match: { receiver: loggedInUserId, isRead: false } }, // Unread messages
      { $group: { _id: "$sender", count: { $sum: 1 } } } // Group by sender and count unread
    ]);

    // Convert result into an object { senderId: true }
    const unreadMap = {};
    unreadMessages.forEach((msg) => {
      unreadMap[msg._id.toString()] = true;
    });

    res.json(unreadMap);
  } catch (error) {
    res.status(500).json({ message: "Error fetching unread messages", error: error.message });
  }
});

router.get("/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const loggedInUserId = req.user._id || req.user.id;

    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const messages = await Message.find({
      $or: [
        { sender: loggedInUserId, receiver: userId },
        { sender: userId, receiver: loggedInUserId },
      ],
    }).sort({ createdAt: 1 });

    await Message.updateMany(
      { sender: userId, receiver: loggedInUserId, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages", error: error.message });
  }
});

module.exports = router;