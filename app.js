const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
require('dotenv').config();
const multer = require('multer');
const path = require('path');

const authRoute = require('./routes/auth');
const productRoute = require('./routes/product');
const cartRoute = require('./routes/cart');
const orderRoute = require('./routes/order');
const historyRoute = require('./routes/history');
const chatRoomRoute = require('./routes/chat');

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://asm-njs03-server.onrender.com',
      'https://asm-njs03-client.onrender.com',
      'https://asm-njs03-admin.onrender.com',
      'https://asm-njs03-admin.vercel.app',
      'https://asm-njs03-client.vercel.app',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/jpg'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

app.use(multer({ storage, fileFilter }).array('files', 5));

app.use('/api/auth', authRoute);
app.use('/api/products', productRoute);
app.use('/api/carts', cartRoute);
app.use('/api/orders', orderRoute);
app.use('/api/histories', historyRoute);
app.use('/api/chatRooms', chatRoomRoute);

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(result => {
    const server = app.listen(5000);
    const io = require('./socket').init(server);
    io.on('connection', socket => {
      console.log('user connect');

      socket.on('send_message', data => {
        socket.join(data.roomId);

        // Gửi tin nhắn cho tất cả các client trong room
        io.to(data.roomId).emit('receive_message', {
          sender: data.sender,
          message: data.message,
        });
        console.log(`Client ${socket.id} joined room ${data.roomId}`);
      });
      socket.on('disconnect', () => {
        console.log('user disconnect!');
      });
    });
  })
  .catch(err => {
    console.log(err);
  });
