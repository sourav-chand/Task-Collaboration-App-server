const express = require("express");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");
const mongoose = require("mongoose");

const router = express.Router();

// Middleware to check database connection
const checkDBConnection = (req, res, next) => {
  console.log("Database connection state:", mongoose.connection.readyState);
  if (mongoose.connection.readyState !== 1) {
    console.log("Database not connected, returning 503");
    return res.status(503).json({ msg: "Database connection not ready" });
  }
  next();
};

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post(
  "/register",
  [
    checkDBConnection,
    body("name", "Name is required").notEmpty(),
    body("email", "Please include a valid email").isEmail(),
    body(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    console.log("Register endpoint called with data:", req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // Check if user already exists
      console.log("Checking if user already exists...");
       let user = await User.findOne({ email });
      if (user) {
        console.log("User already exists with email:", email);
        return res
          .status(400)
          .json({ errors: [{ msg: "User already exists" }] });
      }

      // Create new user
      console.log("Creating new user...");
      user = new User({
        name,
        email,
        password,
      });

      // Save user
      console.log("Saving user to database...");
      await user.save();
      console.log("User saved successfully");

      // Return JWT
      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
        (err, token) => {
          if (err) {
            console.error("JWT signing error:", err);
            throw err;
          }
          console.log("JWT token generated successfully");
          res.json({ token });
        }
      );
    } catch (err) {
      console.error("Registration error:", err.message);
      if (err.name === "MongoError" || err.name === "MongoServerError") {
        console.error("Database error details:", err);
        return res.status(500).json({ msg: "Database error occurred" });
      }
      res.status(500).send("Server error");
    }
  }
);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  "/login",
  [
    checkDBConnection,
    body("email", "Please include a valid email").isEmail(),
    body("password", "Password is required").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Check if user exists
      let user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }

      // Return JWT
      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// @route   GET /api/auth/user
// @desc    Get user by token
// @access  Private
router.get("/user", [checkDBConnection, auth], async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
