const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const Cart = require('../models/cart');
const User = require('../models/user');
const ChatRoom = require('../models/chatRoom');
const Session = require('../models/session');

// GET all users
exports.getAllUsers = (req, res, next) => {
  User.find()
    .then(user => res.status(200).json(user))
    .catch(err => next(err));
};

// POST login
exports.login = (req, res, next) => {
  const { email, password } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: errors.array()[0].msg });
  }

  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        return res.status(422).json({ message: 'Invalid email or password!' });
      }
      bcrypt.compare(password, user.password).then(doMatch => {
        if (doMatch) {
          const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

          const { password, createdAt, updatedAt, ...otherDetails } = user._doc;

          res
            .cookie('access_token', token, {
              httpOnly: true,
              secure: true,
              sameSite: 'None',
            })
            .status(200)
            .json({ details: { ...otherDetails } });
        } else {
          return res
            .status(422)
            .json({ message: 'Invalid email or password!' });
        }
      });
    })
    .catch(err => next(new Error(err)));
};

exports.signup = (req, res, next) => {
  const { fullname, email, password, phone } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json(errors.array()[0].msg);
  }
  bcrypt
    .hash(password, 12)
    .then(hasedPassword => {
      const newUser = new User({
        fullname: fullname,
        email: email,
        password: hasedPassword,
        phone: phone,
        address: '',
      });
      const newCart = new Cart({
        userId: newUser._id,
        items: [],
        total: 0,
      });
      newUser.save();
      newCart.save();
    })
    .then(() => {
      res.send('signup success!');
    })
    .catch(err => next(new Error(err)));
};
