const express = require("express");
const authRoutes = require("./modules/auth/authRoutes");
const errorMiddleware = require("./middlewares/errorMiddleware");
const cors = require("cors");
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
app.use("/", profileRouter);

// Error middleware should be last
app.use(errorMiddleware);

// // 404 handler
// app.use("*", (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: "Route not found",
//   });
// });

module.exports = app;
