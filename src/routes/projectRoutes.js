const express = require("express");
const fs = require("fs"); // ✅ Import filesystem module
const { createProject, getProjects, getProjectLeaders, updateProject } = require("../controllers/projectController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const multer = require("multer");

const router = express.Router();

const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
const upload = multer({ storage });

router.post("/createProject", authMiddleware, upload.single("file"), createProject);
router.get("/", authMiddleware, getProjects);
router.get("/leaders", authMiddleware, getProjectLeaders);
router.put("/updateProject/:id", authMiddleware, updateProject);

module.exports = router;

