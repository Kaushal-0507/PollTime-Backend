const mongoose = require("mongoose");

const pollOptionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
  },
  votes: {
    type: Number,
    default: 0,
  },
  isCustom: {
    type: Boolean,
    default: false,
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const voterInfoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  optionId: {
    type: Number,
    required: true,
  },
  votedAt: {
    type: Date,
    default: Date.now,
  },
});

const pollSchema = new mongoose.Schema(
  {
    // Poll creator
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Basic poll info
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    // Poll options
    options: [pollOptionSchema],

    // Settings from poll form
    allowCustomOptions: {
      type: Boolean,
      default: false,
    },

    allowVoteChanges: {
      type: Boolean,
      default: true,
    },

    maxVoteChanges: {
      type: Number,
      default: 3,
      min: 1,
    },

    isPublic: {
      type: Boolean,
      default: true,
    },

    showVoterInfo: {
      type: Boolean,
      default: false,
    },

    multipleChoice: {
      type: Boolean,
      default: false,
    },

    // For private polls - store emails or user references
    allowedUsers: [
      {
        type: String, // Store email addresses
        lowercase: true,
        trim: true,
      },
    ],

    // For tracking votes
    totalVotes: {
      type: Number,
      default: 0,
    },

    // Voter tracking (if showVoterInfo is true)
    voterInfo: [voterInfoSchema],

    // Track who voted for which option (for vote change limits)
    userVotes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        votes: [
          {
            optionId: Number,
            votedAt: Date,
          },
        ],
        voteCount: {
          type: Number,
          default: 0,
        },
      },
    ],

    // Status
    status: {
      type: String,
      enum: ["active", "ended", "deleted"],
      default: "active",
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Adds updatedAt automatically
  },
);

// Index for efficient queries
pollSchema.index({ createdBy: 1, createdAt: -1 });
pollSchema.index({ status: 1 });
pollSchema.index({ allowedUsers: 1 });

// Helper method to check if user can vote
pollSchema.methods.canUserVote = function (userId, userEmail) {
  // Check if poll is active
  if (this.status !== "active") return false;

  // Check expiration
  if (this.expiresAt && this.expiresAt < new Date()) return false;

  // Check if user is allowed (for private polls)
  if (!this.isPublic) {
    const user = this.allowedUsers.find((email) => email === userEmail);
    if (!user) return false;
  }

  return true;
};

// Helper method to check vote attempts left
pollSchema.methods.getVoteAttemptsLeft = function (userId) {
  const userVote = this.userVotes.find(
    (v) => v.user.toString() === userId.toString(),
  );

  if (!userVote) return this.maxVoteChanges;

  if (!this.allowVoteChanges) return 0;

  return Math.max(0, this.maxVoteChanges - userVote.voteCount);
};

// Helper to get voter info for an option
pollSchema.methods.getVotersForOption = function (optionId) {
  if (!this.showVoterInfo) return [];

  return this.voterInfo
    .filter((v) => v.optionId === optionId)
    .map((v) => v.user);
};

// Helper to format poll for response
pollSchema.methods.toResponseJSON = function (userId) {
  const pollObj = this.toObject();

  // Don't send sensitive info
  delete pollObj.userVotes;

  // Add user-specific info if userId provided
  if (userId) {
    const userVote = this.userVotes.find(
      (v) => v.user.toString() === userId.toString(),
    );
    pollObj.userVote = userVote ? userVote.votes : [];
    pollObj.attemptsLeft = this.getVoteAttemptsLeft(userId);
  }

  // Remove voterInfo if not allowed
  if (!this.showVoterInfo) {
    delete pollObj.voterInfo;
  }

  return pollObj;
};

const Poll = mongoose.model("Poll", pollSchema);

module.exports = Poll;
