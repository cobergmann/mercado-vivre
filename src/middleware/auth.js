const ensureAuthenticatedUser = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

const ensureSameUser = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const routeId = parseInt(req.params.id, 10);
  if (req.user.id !== routeId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};

module.exports = { ensureAuthenticatedUser, ensureSameUser };
