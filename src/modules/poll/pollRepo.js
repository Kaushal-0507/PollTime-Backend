const Poll = require("../../models/pollModel");

class PollRepository {
  async createPoll(pollData) {
    try {
      const poll = await Poll.create(pollData);
      return poll;
    } catch (error) {
      throw new Error(`Failed to create poll: ${error.message}`);
    }
  }

  async findPollById(pollId) {
    try {
      return await Poll.findById(pollId)
        .populate("createdBy", "username email")
        .populate("voterInfo.user", "username email");
    } catch (error) {
      throw new Error(`Failed to find poll: ${error.message}`);
    }
  }

  async findPollsByUser(userId, options = {}) {
    try {
      const { limit = 20, skip = 0, status = "active" } = options;

      return await Poll.find({
        createdBy: userId,
        status: status,
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
    } catch (error) {
      throw new Error(`Failed to find user polls: ${error.message}`);
    }
  }

  async findPublicPolls(options = {}) {
    try {
      const { limit = 20, skip = 0 } = options;

      return await Poll.find({
        isPublic: true,
        status: "active",
      })
        .populate("createdBy", "username email")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
    } catch (error) {
      throw new Error(`Failed to find public polls: ${error.message}`);
    }
  }

  async findPollsForUser(userEmail, options = {}) {
    try {
      const { limit = 20, skip = 0 } = options;

      return await Poll.find({
        isPublic: false,
        allowedUsers: userEmail,
        status: "active",
      })
        .populate("createdBy", "username email")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
    } catch (error) {
      throw new Error(`Failed to find user's private polls: ${error.message}`);
    }
  }

  async updatePoll(pollId, updateData) {
    try {
      return await Poll.findByIdAndUpdate(pollId, updateData, {
        new: true,
        runValidators: true,
      });
    } catch (error) {
      throw new Error(`Failed to update poll: ${error.message}`);
    }
  }

  async deletePoll(pollId) {
    try {
      return await Poll.findByIdAndDelete(pollId);
    } catch (error) {
      throw new Error(`Failed to delete poll: ${error.message}`);
    }
  }

  async addVote(pollId, userId, optionIds, userEmail) {
    try {
      const poll = await Poll.findById(pollId);

      if (!poll) throw new Error("Poll not found");

      // Check if user can vote
      if (!poll.canUserVote(userId, userEmail)) {
        throw new Error("Cannot vote in this poll");
      }

      // Check vote attempts
      const attemptsLeft = poll.getVoteAttemptsLeft(userId);
      if (attemptsLeft <= 0) {
        throw new Error("No vote changes left");
      }

      // Update option votes
      poll.options = poll.options.map((opt) => {
        if (optionIds.includes(opt._id.toString())) {
          opt.votes += 1;
        }
        return opt;
      });

      poll.totalVotes += optionIds.length;

      // Track voter info if enabled
      if (poll.showVoterInfo) {
        optionIds.forEach((optionId) => {
          poll.voterInfo.push({
            user: userId,
            optionId: optionId,
          });
        });
      }

      // Update user vote history
      let userVoteEntry = poll.userVotes.find(
        (v) => v.user.toString() === userId.toString(),
      );

      if (userVoteEntry) {
        userVoteEntry.votes.push({
          optionId: optionIds,
          votedAt: new Date(),
        });
        userVoteEntry.voteCount += 1;
      } else {
        poll.userVotes.push({
          user: userId,
          votes: [
            {
              optionId: optionIds,
              votedAt: new Date(),
            },
          ],
          voteCount: 1,
        });
      }

      await poll.save();
      return poll;
    } catch (error) {
      throw new Error(`Failed to add vote: ${error.message}`);
    }
  }
}

module.exports = new PollRepository();
