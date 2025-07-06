const ensureAuthenticatedUser = (req, res, next) => {
  const userId = req.params.id;
  // Block request from unauthorized user
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (req.user.id !== parseInt(userId, 10)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
};

module.exports = ensureAuthenticatedUser;
