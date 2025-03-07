const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const register = async (req, res) => {
    const {name, email, password, role} = req.body;

    if(!name || !email || !password || !role){
        return res.status(400).json({message: "All fields are required"});
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    try{
        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({name, email, password: hashedPassword, role});
        await user.save();  

        res.status(201).json({message: "User registered successfully"});
    }
    catch(err){
        return res.status(500).json({ message: "Server Error", err });
    }
}

const login = async (req, res) => {
    try{
        const {email, password} = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({email});
        if (!user) return res.status(400).json({ message: "User does not exists" });

        const validPassword = await bcrypt.compare(password, user.password);
        
        if(!validPassword){
            return res.status(400).json({message: "Incorrect password"});
        }

        const token = jwt.sign({id:user._id, role: user.role}, process.env.JWT_SECRET, {expiresIn: "1d"});
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "strict"
        });

        res.json({message: "Login successful", token, user});
    }
    catch(err){
        res.status(500).json({ message: "Server Error", err });
    }
}

const getProfile = async (req, res) => {
    try{
        const user = await User.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            created_at: new Date(user.createdAt).toLocaleString()
        });
    }
    catch(err){
        res.status(500).json({ message: "Server Error", err });
    }
}

const logout = (req, res) => {
    res.clearCookie("token");
    res.json({message: "Logged out successfully"});
}

const getAllUsers = async (req, res) => {
    try{
        if (req.user.role !== "Manager") {
            return res.status(401).json({ message: "Access Denied. Only accessible to Managers" });
        }

        const users = await User.find({ _id: { $ne: req.user._id } });
        res.status(201).json(users);
    }
    catch (err) {
        res.status(500).json({ message: "Server Error", err });
    }
}

module.exports = {register, login, getProfile, logout, getAllUsers};