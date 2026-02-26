const express = require("express");
const authRoutes = require("./modules/auth/authRoutes");
const errorMiddleware = require("./middlewares/errorMiddleware");
const cors = require("cors");
const pollRoutes = require("./modules/poll/pollRoutes");
const cookieParser = require("cookie-parser");
const profileRouter = require("./modules/profile");

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:5173", "http://192.168.1.5:8081"],
    credentials: true,
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/poll", pollRoutes);
app.use("/", profileRouter);

// Error middleware should be last
app.use(errorMiddleware);

module.exports = app;
