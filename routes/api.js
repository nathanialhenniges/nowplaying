const express = require('express');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const querystring = require('querystring');

const router = express.Router();

/**
 * Load Database MOodels
 */
const User = require('../models/User');

/**
 * @route /spotifyCreds
 * @method GET
 * @description Returns spotify creds
 */
router.get(
  '/spotifyCreds',
  rateLimit({
    windowMs: 1000 * 60, // 15 minutes
    max: 4,
    message: {
      message: 'Too many reqeusts.',
      status: 429
    }
  }),
  async (req, res) => {
    try {
      if (!req.headers.authorization) {
        return res.status(401).send('unauthorized');
      }
      const user = await User.findOne({ apiKey: req.headers.authorization });

      if (user) {
        axios
          .get('https://api.spotify.com/v1/me/player', {
            headers: { Authorization: `Bearer ${user.spotify.accessToken}` }
          })
          .catch(async err => {
            console.log('Getting new');

            axios
              .post(
                'https://accounts.spotify.com/api/token/',
                querystring.stringify({
                  grant_type: 'refresh_token',
                  refresh_token: user.spotify.refreshToken,
                  client_id: process.env.SPOTIFY_CLIENT_ID,
                  client_secret: process.env.SPOTIFY_CLIENT_SECRET
                }),
                {
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                  }
                }
              )
              .then(async response => {
                user.spotify.accessToken = response.data.access_token;
                await user.save();
              })
              .catch(err => {
                console.log(err);
              });
          });
        return res.json({
          accessToken: user.spotify.accessToken,
          refreshToken: user.spotify.refreshToken,
          expiresIn: user.spotify.expiresIn
        });
      }

      res.status(401).send('unauthorized');
    } catch (err) {
      console.log(err);
      res.status(500).send('Internal Server Error');
    }
  }
);

module.exports = router;
