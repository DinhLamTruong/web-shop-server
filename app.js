const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
// const session = require('express-session');
// const MongoDBStore = require('connect-mongodb-session')(session);
const bodyParser = require('body-parser');
require('dotenv').config();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Session = require('./models/session');

const authRoute = require('./routes/auth');
const productRoute = require('./routes/product');
const cartRoute = require('./routes/cart');
const orderRoute = require('./routes/order');
const historyRoute = require('./routes/history');
const chatRoomRoute = require('./routes/chat');

const MONGODB_URI =
  'mongodb+srv://lamtruong:SkOAXtwWaaEXEmg9@cluster0.nyndcmn.mongodb.net/products?retryWrites=true&w=majority&appName=Cluster0';

// const store = new MongoDBStore({
//   uri: MONGODB_URI,
//   collection: 'sessions',
// });

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// app.use(
//   session({
//     secret: 'ecommerce',
//     resave: false,
//     saveUninitialized: false,
//     store: store,
//   })
// );

// Set up multer for file uploads
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'public/uploads/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Rename the file
  },
});

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

// Multer configuration for handling multiple file uploads
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).array('files', 5)
);

app.use('/api/auth', authRoute);
app.use('/api/products', productRoute);
app.use('/api/carts', cartRoute);
app.use('/api/orders', orderRoute);
app.use('/api/histories', historyRoute);
app.use('/api/chatRooms', chatRoomRoute);

mongoose
  .connect(MONGODB_URI)
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
