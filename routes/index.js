const express = require('express');
const rateLimit = require('express-rate-limit');

const { nanoid } = require('nanoid');

const router = express.Router();

/**
 * Load Database MOodels
 */
const User = require('../models/User');

/**
 * @route /
 * @method GET
 * @description Shows landing or api key details.
 */
router.get('/', async (req, res) => {
  try {
    if (req.isAuthenticated()) {
      res.render('loggedin');
    } else {
      res.render('index');
    }
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
  }
});

/**
 * @route /key
 * @method GET
 * @description Get API KEy
 */
router.post(
  '/key',
  rateLimit({
    windowMs: 1000 * 60 * 5,
    max: 2,
    message: {
      message: 'Too many reqeusts.',
      status: 429
    }
  }),
  async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        res.redirect('/');
      } else {
        const user = await User.findByIdAndUpdate(
          req.user.id,
          {
            apiKey: nanoid(64)
          },
          {
            $safe: true,
            $upsert: true
          }
        );
        await user.save();
        req.flash('success', 'Your can find your API Key Below');
        res.redirect('/');
      }
    } catch (err) {
      console.log(err);
      res.status(500).send('Internal Server Error');
    }
  }
);
module.exports = router;
