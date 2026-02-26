const pollService = require("./pollService");

// Create a new poll
exports.createPoll = async (req, res, next) => {
  try {
    const pollData = {
      ...req.body,
      createdBy: req.user._id, // From auth middleware
    };

    const poll = await pollService.createPoll(pollData);

    res.status(201).json({
      success: true,
      message: "Poll created successfully",
      data: { poll },
    });
  } catch (err) {
    next(err);
  }
};

// Get a single poll by ID
exports.getPoll = async (req, res, next) => {
  try {
    const { pollId } = req.params;
    const userId = req.user?.id; // Optional, for user-specific info

    const poll = await pollService.getPoll(pollId, userId, req.user?.email);

    res.json({
      success: true,
      data: { poll },
    });
  } catch (err) {
    next(err);
  }
};

// Get all polls for current user
exports.getMyPolls = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit, skip, status } = req.query;

    const polls = await pollService.getUserPolls(userId, {
      limit,
      skip,
      status,
    });

    res.json({
      success: true,
      data: { polls },
    });
  } catch (err) {
    next(err);
  }
};

// Get public polls
exports.getPublicPolls = async (req, res, next) => {
  try {
    const { limit, skip } = req.query;

    const polls = await pollService.getPublicPolls({ limit, skip });

    res.json({
      success: true,
      data: { polls },
    });
  } catch (err) {
    next(err);
  }
};

// Get private polls for user
exports.getPrivatePolls = async (req, res, next) => {
  try {
    const userEmail = req.user.email;
    const { limit, skip } = req.query;

    const polls = await pollService.getPrivatePolls(userEmail, { limit, skip });

    res.json({
      success: true,
      data: { polls },
    });
  } catch (err) {
    next(err);
  }
};

// Vote on a poll
exports.vote = async (req, res, next) => {
  try {
    const { pollId } = req.params;
    const { optionIds } = req.body; // Array of option IDs
    const userId = req.user.id;
    const userEmail = req.user.email;

    const poll = await pollService.vote(pollId, userId, optionIds, userEmail);

    res.json({
      success: true,
      message: "Vote recorded successfully",
      data: { poll },
    });
  } catch (err) {
    next(err);
  }
};

// Add custom option to poll
exports.addCustomOption = async (req, res, next) => {
  try {
    const { pollId } = req.params;
    const { optionText } = req.body;
    const userId = req.user.id;

    const poll = await pollService.addCustomOption(pollId, userId, optionText);

    res.json({
      success: true,
      message: "Custom option added successfully",
      data: { poll },
    });
  } catch (err) {
    next(err);
  }
};

// Update poll settings (creator only)
exports.updatePoll = async (req, res, next) => {
  try {
    const { pollId } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const poll = await pollService.updatePoll(pollId, userId, updateData);

    res.json({
      success: true,
      message: "Poll updated successfully",
      data: { poll },
    });
  } catch (err) {
    next(err);
  }
};

// Delete poll (creator only)
exports.deletePoll = async (req, res, next) => {
  try {
    const { pollId } = req.params;
    const userId = req.user.id;

    await pollService.deletePoll(pollId, userId);

    res.json({
      success: true,
      message: "Poll deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};
