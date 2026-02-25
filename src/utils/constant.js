exports.USER_VISIBLE_INFO = (user) => {
  return {
    id: user._id,
    email: user.email,
    username: user.username,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  };
};
