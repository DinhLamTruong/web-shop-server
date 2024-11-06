const express = require('express');

const route = express.Router();

const historyControllers = require('../controllers/history');

route.get('/', historyControllers.getHistory);

route.get('/data', historyControllers.getHistoryData);

route.get('/all', historyControllers.getAllHistory);

route.get('/:id', historyControllers.getHistoryDetail);

module.exports = route;
