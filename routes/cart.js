const express = require('express');
const { verifyToken } = require('../utils/veryfiToken');

const route = express.Router();

const cartControllers = require('../controllers/cart');

route.get('/', verifyToken, cartControllers.getCarts);

route.post('/add', verifyToken, cartControllers.postAddToCart);

route.put('/update', verifyToken, cartControllers.putUpdateCart);

route.delete('/delete', verifyToken, cartControllers.deleteProduct);

module.exports = route;
