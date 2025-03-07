const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
    name: {type: String, require: true},
    description: {type: String},
    managerId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    projectLeader: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    deadline: { type: Date, required: true }, 
    tasks: [{type: mongoose.Schema.Types.ObjectId, ref: "Task"}],
    status: {type: String, enum: ["Not Started", "In Progress", "Completed"], default: "Not Started"},
    file: { type: String },
});

module.exports = mongoose.model("Project", projectSchema);