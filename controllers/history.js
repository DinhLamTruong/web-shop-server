const order = require('../models/order');
const Order = require('../models/order');
const User = require('../models/user');

// GET history theo user
exports.getHistory = (req, res, next) => {
  const { idUser } = req.query;
  Order.find({ userId: idUser })
    .then(order => res.status(200).json(order))
    .catch(err => next(err));
};

// GET all history
exports.getAllHistory = (req, res, next) => {
  Order.find()
    .then(order => {
      res.status(200).json(order);
    })
    .catch(err => next(err));
};

// GET tổng user, order , tổng tiền của tất cả order
exports.getHistoryData = (req, res, next) => {
  Promise.all([
    User.countDocuments(),// đếm số lượng document trong collection users -> tổng user
    Order.aggregate([ // trả về kết quả tổng hợp
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$total' },
          totalOrder: { $sum: 1 },
        },
      },
    ]),
  ])
    .then(([clientCount, orderStats]) => {
      const orderData = orderStats[0] || { totalAmount: 0, totalOrder: 0 };
      res.json({
        clientCount,
        orderCount: orderData.totalOrder,
        earnings: orderData.totalAmount,
      });
    })
    .catch(error => {
      console.error('Error fetching counts:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    });
};


exports.getHistoryDetail = (req, res, next) => {
  const id = req.params.id;
  Order.find({ _id: id })
    .populate('products.productId')
    .then(order => {
      res.status(200).json(order);
    })
    .catch(err => next(err));
};
