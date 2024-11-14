const ChatRoom = require('../models/chatRoom');
const ChatMessage = require('../models/chatMessage');
const chatRoom = require('../models/chatRoom');
const Session = require('../models/session');

// GET all room chat role === ['customer']
exports.getAllRoom = (req, res, next) => {
  ChatRoom.find()
    .populate({
      path: 'users',
      match: { role: { $in: ['customer'] } },
    })
    .then(rooms => {
      const customerRooms = rooms.filter(
        room => room.users && room.users.length > 0
      );
      res.status(200).json(customerRooms);
    })
    .catch(err => {
      console.error('Error fetching rooms:', err);
      next(err);
    });
};

exports.postCreateSession = async (req, res, next) => {
  try {
    const { roomId, sender } = req.body;

    let chatRoom;
    let roomID;

    // Nếu roomId không được cung cấp, tạo phòng chat mới với sender
    if (!roomId) {
      const room = await ChatRoom.findOne({ users: { $in: [sender] } });

      if (!room) {
        chatRoom = new ChatRoom({
          users: [sender],
        });
        const newRoom = await chatRoom.save();

        roomID = newRoom._id; // Lưu id của phòng chat mới
      } else {
        chatRoom = room;
        roomID = room._id;
      }
    } else {
      // Nếu roomId có sẵn, tìm phòng chat theo roomId
      chatRoom = await ChatRoom.findById(roomId);
      if (!chatRoom) {
        return res.status(404).json({ message: 'Chat room not found' });
      }
    }
    // Kiểm tra xem session đã tồn tại cho phòng chat này và sender chưa
    let session = await Session.findOne({
      chatRoomId: chatRoom?._id,
      userId: sender,
    });

    if (!session) {
      // Tạo mới session nếu chưa có
      session = new Session({
        chatRoomId: chatRoom._id,
        userId: sender,
      });
      await session.save();
    } else {
      return res.status(200).json({ roomID });
    }
    return res
      .status(200)
      .json({ message: 'Session created successfully', roomID });
  } catch (err) {
    next(err);
  }
};

exports.putAddMessage = (req, res, next) => {
  const { roomId, sender, message } = req.body;

  ChatRoom.findById(roomId)
    .then(room => {
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      const newMessage = new ChatMessage({
        sender,
        roomId: room._id,
        message,
      });
      newMessage.save().then(() => {
        return res.json('add message successfully!');
      });
    })
    .catch(err => next(err));
};

exports.getMessageByRoom = (req, res, next) => {
  const roomId = req.query.roomId;
  const page = parseInt(req.query.page || 1);

  if (roomId) {
    ChatMessage.find({ roomId: roomId })
      .then(messagesData => {
        if (!messagesData || messagesData.length === 0) {
          return [];
        }

        let resultMess = [];
        const pageSize = 8;
        const totalPage = Math.ceil(messagesData.length / pageSize);

        if (page > totalPage) {
          return res.status(200).json(resultMess);
        }

        // page === 1 -> 8 message cuối cùng trong mảng
        if (page === 1) {
          resultMess = messagesData.slice(-8);
        } else {
          const start = -pageSize * page;
          const end = -pageSize * (page - 1);
          resultMess = messagesData.slice(start, end);
        }

        res.status(200).json(resultMess);
      })
      .catch(err => next(err));
  } else {
    return res.json([]);
  }
};

exports.postDeleteRoom = async (req, res, next) => {
  const { roomId } = req.body;

  try {
    const room = await chatRoom.findOneAndDelete({ _id: roomId });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    await Session.findOneAndDelete({ chatRoomId: roomId });
    res.status(200).json({
      message: 'Room and associated session deleted successfully!',
    });
  } catch (err) {
    next(err);
  }
};
