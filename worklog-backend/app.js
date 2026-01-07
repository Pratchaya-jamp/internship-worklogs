const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./src/routes/authRoutes");
const errorHandler = require("./src/middlewares/errorHandler");
const requestLogger = require("./src/middlewares/requestLogger");
const cookieParser = require("cookie-parser");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

// Routes
app.use("/api/auth", authRoutes);

// Health Check
app.get("/", (req, res) => {
    res.send("Worklog API Ready 🚀");
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});