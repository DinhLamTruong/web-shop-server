const express = require('express');
const { body } = require('express-validator');
const User = require('../models/user');

const route = express.Router();

const authControllers = require('../controllers/auth');
const { veryfiAccount } = require('../utils/veryfiAccount');

route.get('/users', authControllers.getAllUsers);

route.post(
  '/login',
  [
    body('email')
      .notEmpty()
      .trim()
      .isEmail()
      .withMessage('Please enter a valid email.'),
    body('password', 'Please enter a password least 8 characters.')
      .notEmpty()
      .isLength({ min: 8 }),
  ],
  authControllers.login
);

route.post(
  '/admin/login',
  [
    body('email')
      .notEmpty()
      .trim()
      .isEmail()
      .withMessage('Please enter a valid email.'),
    body('password', 'Please enter a password least 8 characters.')
      .notEmpty()
      .isLength({ min: 8 }),
  ],
  veryfiAccount,
  authControllers.login
);

route.post(
  '/signup',
  [
    body('fullname').notEmpty(),
    body('email')
      .notEmpty()
      .isEmail()
      .withMessage('Please enter a valid email.')
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then(user => {
          if (user) {
            return Promise.reject('Email exsit already!');
          }
        });
      }),
    body('password', 'Please enter a password least 8 characters.')
      .notEmpty()
      .isLength({ min: 8 }),
    body('phone').notEmpty(),
  ],
  authControllers.signup
);

module.exports = route;
