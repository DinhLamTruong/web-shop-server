const Cart = require('../models/cart');
const Product = require('../models/product');

// GET cart -> id user
exports.getCarts = (req, res, next) => {
  const { idUser } = req.query;

  Cart.findOne({ userId: idUser })
    .populate('userId')
    .populate('items.productId')
    .then(cart => {
      if (!cart) return res.status(404).json({ message: 'Not found cart!' });
      const userId = cart.userId;

      const arrCart = cart.items;

      const listCart = arrCart.map(item => ({ ...item, userId }));

      res.status(200).json(listCart);
    })
    .catch(err => next(err));
};

// POST products -> cart
exports.postAddToCart = (req, res, next) => {
  const { idUser, idProduct, count } = req.query;

  // check user có cart chưa
  Cart.findOne({ userId: idUser }).then(cart => {
    // user chưa có -> tạo cart
    if (!cart) {
      const newCart = new Cart({
        userId: idUser,
        items: [
          {
            productId: idProduct,
            quantity: count,
          },
        ],
      });
      return newCart.save().then(result => {
        return res.status(200).json({ message: 'Product added to a new cart' });
      });
    }
    // user có cart -> check user có product trong cart chưa
    const existingProduct = cart?.items.find(
      item => item.productId.toString() === idProduct
    );
    // trong cart có product -> không thêm được product
    if (existingProduct) {
      return res
        .status(409)
        .json({ message: 'Sản phẩm đã có trong giỏ hàng!' });
    } else {
      // Sản phẩm chưa có -> thêm mới vào giỏ hàng
      Cart.updateOne(
        { userId: idUser },
        {
          $push: { items: { productId: idProduct, quantity: count } }, // Thêm sản phẩm mới vào giỏ hàng
        }
      ).then(result => {
        return res.status(200).json({ message: 'Product added to cart' });
      });
    }
  });
};

// PUT cart
exports.putUpdateCart = (req, res, next) => {
  const { idUser, idProduct, count } = req.query;

  Product.findById(idProduct).then(product => {
    // check số lượng mua > số lượng product trong kho -> không cập nhật cart
    if (product.count < count) {
      return res.status(409).json({
        message: `Product ${product.name} only has ${product.count} items in stock.`,
      });
    }

    // số lượng mua < số lượng product trong kho -> cập nhật cart
    Cart.updateOne(
      {
        userId: idUser,
        'items.productId': idProduct,
      },
      { $set: { 'items.$.quantity': count } }
    )
      .then(result => {
        res.status(200).json({ message: 'update cart success!' });
      })
      .catch(err => next(err));
  });
};

exports.deleteProduct = (req, res, next) => {
  const { idUser, idProduct } = req.query;

  Cart.updateOne(
    { userId: idUser, 'items.productId': idProduct },
    { $pull: { items: { productId: idProduct } } }
  )
    .then(result => {
      res.status(200).json({ message: 'delete product success!' });
    })
    .catch(err => next(err));
};
