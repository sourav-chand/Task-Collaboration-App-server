const express = require("express");
const { body, validationResult } = require("express-validator");
const auth = require("../middleware/auth");
const Project = require("../models/Project");
const Task = require("../models/Task");
const mongoose = require("mongoose");

const router = express.Router();

// Middleware to check database connection
const checkDBConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ msg: "Database connection not ready" });
  }
  next();
};

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private
router.post(
  "/",
  [checkDBConnection, auth, [body("name", "Name is required").notEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, description } = req.body;

      const project = new Project({
        name,
        description,
        owner: req.user.id,
        members: [req.user.id],
      });

      const savedProject = await project.save();

      // Populate owner details
      await savedProject.populate("owner", "name");

      res.json(savedProject);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// @route   GET /api/projects
// @desc    Get all projects for the authenticated user
// @access  Private
router.get("/", [checkDBConnection, auth], async (req, res) => {
  try {
    // Find projects where user is owner, member, or has assigned tasks
    const projectsWithAssignedTasks = await Task.find({
      assignedTo: req.user.id,
    }).distinct("project");

    const projects = await Project.find({
      $or: [
        { owner: req.user.id },
        { members: req.user.id },
        { _id: { $in: projectsWithAssignedTasks } },
      ],
    })
      .populate("owner", "name")
      .populate("members", "name email") // Populate members with name and email
      .sort({ date: -1 });

    res.json(projects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete a project
// @access  Private
router.delete("/:id", [checkDBConnection, auth], async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }

    // Check user is owner
    if (project.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    // Delete all tasks associated with the project
    await Task.deleteMany({ project: req.params.id });

    // Delete project
    await Project.findByIdAndDelete(req.params.id);

    res.json({ msg: "Project removed" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Project not found" });
    }
    res.status(500).send("Server error");
  }
});

module.exports = router;
