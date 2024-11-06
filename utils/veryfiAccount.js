const User = require('../models/user');

exports.veryfiAccount = (req, res, next) => {
  const { email } = req.body;

  const user = User.findOne({ email: email });
  user.then(user => {
    if (!user || user.role !== 'customer') {
      next();
    } else {
      res.status(403).json({ message: 'You are not authorized!' });
    }
  });
};
