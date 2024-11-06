const express = require('express');
const { verifyToken } = require('../utils/veryfiToken');

const route = express.Router();

const orderControllers = require('../controllers/order');

route.post('/email', verifyToken, orderControllers.postOrder);

module.exports = route;
