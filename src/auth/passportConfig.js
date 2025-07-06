const LocalStrategy = require("passport-local").Strategy;
const { query } = require("../db/index.js");
const bcrypt = require("bcrypt");

const initialize = (passport) => {
  passport.use(
    new LocalStrategy(
      {
        // We use email as username
        usernameField: "email",
      },
      async (username, password, done) => {
        try {
          // Find user
          const result = await query("SELECT * FROM users WHERE email = $1", [
            username,
          ]);
          const user = result.rows[0];
          if (!user) {
            return done(null, false, { message: "User not found" });
          }

          // Validating password
          const isValid = await bcrypt.compare(password, user.password_hash);
          if (!isValid) {
            return done(null, false, { message: "Wrong password" });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const result = await query("SELECT * FROM users WHERE id = $1", [id]);
      done(null, result.rows[0]);
    } catch (err) {
      return done(err);
    }
  });
};

module.exports = initialize;
