const Task = require("../models/Task");
const User = require("../models/User");
const Project = require("../models/Project");

const createTask = async (req, res) => {
    try{
        if(req.user.role !== "Project Leader"){
            return res.status(401).json({message: "Access Denied"});
        }

        const {title, description, projectId, assignedTo, deadline} = req.body;

        const existingTasks = await Task.findOne({ projectId });

        if (!existingTasks) {
            await Project.findByIdAndUpdate(projectId, { status: "In Progress" });
        }

        const task = new Task({title, description, projectId, assignedTo, deadline});

        await task.save();
        res.status(201).json({message: "Task created successfully", task});
    }
    catch(err){
        res.status(500).json({ message: "Server Error", err });
    }
}

const getTasks = async (req, res) => {
    try{
        let tasks;
        if(req.user.role === "Manager"){
            tasks = await Task.find().populate("assignedTo projectId");
        }
        else if(req.user.role === "Project Leader"){
            const projectId = req.query.projectId; 
            if (!projectId) {
                return res.status(400).json({ message: "Project ID is required" });
            }
            tasks = await Task.find({ projectId }).populate("assignedTo");
        }
        else{
            tasks = await Task.find({assignedTo: req.user.id});
        }

        res.status(201).json(tasks);
    }
    catch(err){
        res.status(500).json({ message: "Server Error", err });
    }
}

const getAllTasks = async (req, res) => {
    try{
        if(req.user.role==="Team Member"){
            return res.status(401).json({message: "Access Denied. Only accessible to Managers and Project Leaders"});
        }

        const tasks = await Task.find().populate("projectId");

        res.status(201).json(tasks);
    }
    catch(err){
        res.status(500).json({ message: "Server Error", err });
    }
}

const getProjectName = async (req, res) => {
    try{
        const projectId = req.query.projectId;
        if (!projectId) {
            return res.status(400).json({ message: "Project ID is required" });
        }
        const project = await Project.findOne({ _id: projectId }).select("name");

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        res.status(201).json(project.name);
    }
    catch(err){
        res.status(500).json({ message: "Server Error", err });
    }
}

const getTeamMembers = async (req, res) => {
    try{
        if (req.user.role !== "Project Leader") {
            return res.status(401).json({ message: "Access Denied. Only accessible to Project Leaders" });
        }

        const members = await User.find({role: "Team Member"}).select("name _id");
        res.json(members);
    }
    catch (err) {
        res.status(500).json({ message: "Server Error", err });
    }
}

module.exports = {createTask, getTasks, getAllTasks, getTeamMembers, getProjectName};