const authRepo = require("../modules/auth/authRepo");
const { verifyToken } = require("../utils/jwt");

exports.protect = async (req, res, next) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = verifyToken(token);
    const { email } = decoded;
    const user = await authRepo.findByEmail(email);

    if (!user) {
      throw new Error("User not found!!!");
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};
