const express = require("express");
const router = express.Router();
const pollController = require("./pollController");
const { protect } = require("../../middlewares/authMiddleware");

// All poll routes require authentication
router.use(protect);

// Create and get polls
router.post("/create-poll", pollController.createPoll);
router.get("/my-polls", pollController.getMyPolls);
router.get("/public", pollController.getPublicPolls);
router.get("/private", pollController.getPrivatePolls);

// Single poll operations
router.get("/:pollId", pollController.getPoll);
router.put("/:pollId", pollController.updatePoll);
router.delete("/:pollId", pollController.deletePoll);

// Voting
router.post("/:pollId/vote", pollController.vote);
router.post("/:pollId/custom-option", pollController.addCustomOption);

module.exports = router;
