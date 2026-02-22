const User = require("../../models/userModel");

class AuthRepository {
  async findByEmail(email) {
    try {
      return await User.findOne({ email });
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  async createUser(userData) {
    try {
      return await User.create(userData);
    } catch (error) {
      if (error.code === 11000) {
        throw new Error("Email already exists");
      }
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async updateUser(userId, updateData) {
    try {
      return await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
      });
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }
}

module.exports = new AuthRepository();
