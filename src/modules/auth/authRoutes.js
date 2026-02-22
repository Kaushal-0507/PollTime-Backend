const express = require("express");
const router = express.Router();
const controller = require("./authController");

router.post("/signup", controller.signup);
router.post("/verify", controller.verify);
router.post("/login", controller.login);
router.post("/resend-otp", controller.resendOtp); // New endpoint

module.exports = router;
