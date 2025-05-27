// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const Signuproutes = require("./routes/signup.routes");
const adminRoutes = require("./routes/admin.routes");
// const classroomRoutes = require('./routes/classroom.routes');
const assignmentRoutes = require("./routes/assignment.routes");
const jwt = require("jsonwebtoken");
const studentRoutes = require("./routes/student.routes");
const facultyRoutes = require("./routes/faculty.routes");
const path = require("path");
const uploadRoutes = require("./routes/upload.routes");
const errorHandler = require("./middleware/error.middleware");

dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https://ai-based-evaluation-platform.onrender.com" // Remove any trailing slash
        : // ? process.env.FRONTEND_URL
          "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", Signuproutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/faculty", facultyRoutes);
// app.use('/api/assignments', assignmentRoutes);
app.use("/api/upload", uploadRoutes);

app.get("/api/auth/status", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.json({ isAuthenticated: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({
      isAuthenticated: true,
      userRole: decoded.role,
      userName: decoded.name,
    });
  } catch (error) {
    res.json({ isAuthenticated: false });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../server/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../server/build", "index.html"));
  });
}

// Error handling middleware (should be last)
app.use(errorHandler);

const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
