const express = require("express");
const Project = require("../models/Project");
const Task = require("../models/Task");
const router = express.Router();
const {authMiddleware} = require("../middlewares/authMiddleware");

router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    const totalProjects = await Project.countDocuments();
    const totalTasks = await Task.countDocuments();
    const pendingTasks = await Task.countDocuments({ assignedTo: user.id, status: {$ne: "Completed"}});
    const completedTasks = await Task.countDocuments({ assignedTo: user.id, status: "Completed"});

    let assignedProjects = 0;
    let assignedTasks = 0;

    if (user.role === "Project Leader") {
      assignedProjects = await Project.countDocuments({ projectLeader: user._id });
      assignedTasks = await Task.countDocuments({ assignedTo: user._id });
    } else if (user.role === "Team Member") {
      assignedTasks = await Task.countDocuments({ assignedTo: user._id });
    }

    res.json({
      totalProjects,
      totalTasks,
      pendingTasks,
      completedTasks,
      assignedProjects,
      assignedTasks,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
