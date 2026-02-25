const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const { USER_VISIBLE_INFO } = require("../utils/constant");
const profileRouter = express.Router();

profileRouter.get("/profile/view", protect, async (req, res) => {
  try {
    const user = req.user;

    res.send(USER_VISIBLE_INFO(user));
  } catch (error) {
    res.status(400).send("Error: " + error.message);
  }
});

module.exports = profileRouter;
