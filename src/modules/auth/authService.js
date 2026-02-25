const bcrypt = require("bcryptjs");
const authRepo = require("./authRepo");
const { generateToken } = require("../../utils/jwt");
const { generateOTP } = require("../../utils/otp");
const { sendOTPEmail } = require("../../utils/email");
const AppError = require("../../utils/AppError");

class AuthService {
  async signup(email, password, name) {
    try {
      // Validate input
      if (!email || !password) {
        throw new AppError("Email and password are required", 400);
      }

      const existingUser = await authRepo.findByEmail(email);

      // Case 1: User exists but not verified - resend OTP
      if (existingUser && existingUser.isVerified === false) {
        const otp = generateOTP();
        const updatedUser = await authRepo.updateUser(existingUser._id, {
          otp,
          otpExpires: Date.now() + 10 * 60 * 1000, // 10 minutes
        });

        await sendOTPEmail(email, otp);

        return {
          message: "A new OTP has been sent to your email. Please verify.",
          requiresVerification: true,
        };
      }

      // Case 2: User exists and is verified
      if (existingUser && existingUser.isVerified === true) {
        throw new AppError("User already exists with this email", 409);
      }

      // Case 3: New user
      const hashedPassword = await bcrypt.hash(password, 10);
      const otp = generateOTP();

      const newUser = await authRepo.createUser({
        email,
        password: hashedPassword,
        otp,
        username: name,
        otpExpires: Date.now() + 10 * 60 * 1000,
        isVerified: false,
      });

      await sendOTPEmail(email, otp);

      return {
        message: "OTP sent to email. Please verify to complete registration.",
        requiresVerification: true,
      };
    } catch (error) {
      throw error;
    }
  }

  async resendOtp(email) {
    try {
      if (!email) {
        throw new AppError("Email is required", 400);
      }

      const user = await authRepo.findByEmail(email);

      if (!user) {
        throw new AppError("No account found with this email", 404);
      }

      if (user.isVerified) {
        throw new AppError(
          "This email is already verified. Please login.",
          400,
        );
      }

      // Generate new OTP
      const otp = generateOTP();
      const updatedUser = await authRepo.updateUser(user._id, {
        otp,
        otpExpires: Date.now() + 10 * 60 * 1000, // 10 minutes
      });

      await sendOTPEmail(email, otp);

      return {
        message: "A new verification code has been sent to your email.",
        expiresIn: 600, // 10 minutes in seconds
      };
    } catch (error) {
      throw error;
    }
  }

  async verify(email, otp) {
    try {
      if (!email || !otp) {
        throw new AppError("Email and OTP are required", 400);
      }

      const user = await authRepo.findByEmail(email);

      if (!user) {
        throw new AppError("User not found", 404);
      }

      if (user.isVerified) {
        throw new AppError("Email already verified", 400);
      }

      // Check if OTP expired
      if (user.otpExpires < Date.now()) {
        throw new AppError("OTP has expired. Please request a new one.", 400);
      }

      // Verify OTP
      if (user.otp !== otp) {
        throw new AppError("Invalid OTP. Please try again.", 400);
      }

      // Mark as verified
      const verifiedUser = await authRepo.updateUser(user._id, {
        isVerified: true,
        otp: null,
        otpExpires: null,
      });

      return {
        message: "Email verified successfully. You can now login.",
        user: {
          id: verifiedUser._id,
          email: verifiedUser.email,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async login(email, password) {
    try {
      if (!email || !password) {
        throw new AppError("Email and password are required", 400);
      }

      const user = await authRepo.findByEmail(email);

      if (!user) {
        throw new AppError("Invalid credentials", 401);
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new AppError("Invalid credentials", 401);
      }

      if (!user.isVerified) {
        throw new AppError("Please verify your email before logging in", 403);
      }

      const token = generateToken({
        id: user._id,
        email: user.email,
      });

      return {
        token,
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AuthService();
