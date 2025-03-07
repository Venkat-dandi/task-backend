const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
    title: {type: String, required: true},
    description: {type: String},
    projectId: {type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true},
    assignedTo: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    status: {type: String, enum: ["To Do", "In Progress", "Completed"], default: "To Do"},
    deadline: {type: Date},
    progress: {type: Number, min: 0, max: 100, default: 0}
});

module.exports = mongoose.model("Task", taskSchema);