const express = require('express');
const { verifyToken } = require('../utils/veryfiToken');

const route = express.Router();

const chatControllers = require('../controllers/chat');

route.get('/all-room', chatControllers.getAllRoom);

route.post('/create-session', verifyToken, chatControllers.postCreateSession);

route.put('/add-message', verifyToken, chatControllers.putAddMessage);

route.get('/roomId', verifyToken, chatControllers.getMessageByRoom);

route.post('/delete-room', verifyToken, chatControllers.postDeleteRoom);

module.exports = route;
