const express = require('express');
const { verifyToken } = require('../utils/veryfiToken');
const route = express.Router();

const productControllers = require('../controllers/product');

route.get('/shop', productControllers.getCategory);

route.get('/:idProduct', productControllers.getProduct);

route.get('/', productControllers.getProducts);

route.post('/add-product', verifyToken, productControllers.postAddProduct);

route.put(
  '/edit-product/:idProduct',
  verifyToken,
  productControllers.updateProduct
);

route.delete(
  '/delete-product/:idProduct',
  verifyToken,
  productControllers.deleteProduct
);

module.exports = route;
