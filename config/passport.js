const SpotifyStrategy = require('passport-spotify').Strategy;

/**
 * Load MongoDB models.
 */
const User = require('../models/User');

module.exports = passport => {
  passport.use(
    new SpotifyStrategy(
      {
        clientID: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        callbackURL: process.env.SPOTIFY_CALLBACK
      },
      async (accessToken, refreshToken, expiresIn, profile, done) => {
        try {
          let user = await User.findOne({ username: profile.id });
          if (!user) {
            user = User.create({
              username: profile.id,
              // eslint-disable-next-line dot-notation
              email: profile['_json'].email,
              spotify: {
                accessToken,
                refreshToken,
                expiresIn
              }
            });
            await user.save();
            console.log(user);

            return done(null, user);
          }

          // eslint-disable-next-line dot-notation
          user.email = profile['_json'].email;
          user.spotify.accessToken = accessToken;
          user.spotify.refreshToken = refreshToken;
          user.spotify.expiresIn = expiresIn;
          await user.save();

          console.log(user);

          done(null, user);
        } catch (err) {
          done(err, null);
        }
      }
    )
  );
};
