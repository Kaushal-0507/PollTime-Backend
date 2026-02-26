const pollRepo = require("./pollRepo");
const AppError = require("../../utils/AppError");

class PollService {
  async createPoll(pollData) {
    try {
      // Format options for storage
      const formattedOptions = pollData.options.map((text, index) => ({
        text,
        votes: 0,
        isCustom: false,
      }));

      const poll = await pollRepo.createPoll({
        createdBy: pollData.createdBy,
        title: pollData.title,
        options: formattedOptions,
        allowCustomOptions: pollData.allowCustomOptions || false,
        allowVoteChanges: pollData.allowVoteChanges || true,
        maxVoteChanges: pollData.maxVoteChanges || 3,
        isPublic: pollData.isPublic !== undefined ? pollData.isPublic : true,
        showVoterInfo: pollData.showVoterInfo || false,
        multipleChoice: pollData.multipleChoice || false,
        allowedUsers: pollData.allowedUsers || [],
        createdAt: pollData.createdAt || new Date(),
        expiresAt: pollData.expiresAt || null,
      });

      return poll;
    } catch (error) {
      throw error;
    }
  }

  async getPoll(pollId, userId, userEmail) {
    try {
      const poll = await pollRepo.findPollById(pollId);

      if (!poll) {
        throw new AppError("Poll not found", 404);
      }

      // Check access for private polls
      if (!poll.isPublic) {
        const isAllowed =
          poll.allowedUsers.includes(userEmail) ||
          poll.createdBy._id.toString() === userId;

        if (!isAllowed) {
          throw new AppError("You don't have access to this poll", 403);
        }
      }

      return poll.toResponseJSON(userId);
    } catch (error) {
      throw error;
    }
  }

  async getUserPolls(userId, options) {
    try {
      const polls = await pollRepo.findPollsByUser(userId, options);
      return polls.map((poll) => poll.toResponseJSON(userId));
    } catch (error) {
      throw error;
    }
  }

  async getPublicPolls(options) {
    try {
      const polls = await pollRepo.findPublicPolls(options);
      return polls.map((poll) => poll.toResponseJSON());
    } catch (error) {
      throw error;
    }
  }

  async getPrivatePolls(userEmail, options) {
    try {
      const polls = await pollRepo.findPollsForUser(userEmail, options);
      return polls.map((poll) => poll.toResponseJSON());
    } catch (error) {
      throw error;
    }
  }

  async vote(pollId, userId, optionIds, userEmail) {
    try {
      // Ensure optionIds is an array
      const optionIdArray = Array.isArray(optionIds) ? optionIds : [optionIds];

      const poll = await pollRepo.addVote(
        pollId,
        userId,
        optionIdArray,
        userEmail,
      );

      return poll.toResponseJSON(userId);
    } catch (error) {
      throw error;
    }
  }

  async addCustomOption(pollId, userId, optionText) {
    try {
      const poll = await pollRepo.findPollById(pollId);

      if (!poll) {
        throw new AppError("Poll not found", 404);
      }

      if (!poll.allowCustomOptions) {
        throw new AppError("This poll does not allow custom options", 400);
      }

      if (poll.options.length >= 20) {
        throw new AppError("Maximum number of options reached", 400);
      }

      poll.options.push({
        text: optionText,
        votes: 0,
        isCustom: true,
        addedBy: userId,
      });

      await poll.save();

      return poll.toResponseJSON(userId);
    } catch (error) {
      throw error;
    }
  }

  async updatePoll(pollId, userId, updateData) {
    try {
      const poll = await pollRepo.findPollById(pollId);

      if (!poll) {
        throw new AppError("Poll not found", 404);
      }

      if (poll.createdBy._id.toString() !== userId) {
        throw new AppError("Only the poll creator can update it", 403);
      }

      // Only allow updating certain fields
      const allowedUpdates = [
        "title",
        "allowCustomOptions",
        "allowVoteChanges",
        "maxVoteChanges",
        "showVoterInfo",
        "multipleChoice",
        "status",
        "expiresAt",
      ];

      const update = {};
      allowedUpdates.forEach((field) => {
        if (updateData[field] !== undefined) {
          update[field] = updateData[field];
        }
      });

      const updatedPoll = await pollRepo.updatePoll(pollId, update);

      return updatedPoll.toResponseJSON(userId);
    } catch (error) {
      throw error;
    }
  }

  async deletePoll(pollId, userId) {
    try {
      const poll = await pollRepo.findPollById(pollId);

      if (!poll) {
        throw new AppError("Poll not found", 404);
      }

      if (poll.createdBy._id.toString() !== userId) {
        throw new AppError("Only the poll creator can delete it", 403);
      }

      await pollRepo.deletePoll(pollId);

      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new PollService();
