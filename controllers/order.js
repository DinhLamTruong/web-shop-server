const nodemailer = require('nodemailer');

const Cart = require('../models/cart');
const Order = require('../models/order');
const Product = require('../models/product');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for port 465, false for other ports
  auth: {
    user: process.env.USER,
    pass: process.env.PASS,
  },
});

exports.postOrder = (req, res, next) => {
  const { address, fullname, idUser, phone, to, yourOrder } = req.body;

  const updatePromises = yourOrder.map(item => {
    const { productId, quantity } = item;

    // Sử dụng updateOne để cập nhật từng sản phẩm, count -1 khi order
    return Product.updateOne(
      { _id: productId, count: { $gte: quantity } }, // Kiểm tra count đủ lớn để giảm
      { $inc: { count: -quantity } } // Giảm số lượng dựa vào quantity
    );
  });

  // Chờ tất cả các cập nhật hoàn tất
  Promise.all(updatePromises);

  Cart.findOne({ userId: idUser })
    .populate('items.productId')
    .then(cart => {
      if (!cart) {
        return res.status(404).json('Not found cart!');
      }

      let sub_total = 0;
      function getTotal(cart) {
        cart.items.map(value => {
          return (sub_total +=
            parseInt(value.productId.price) * parseInt(value.quantity));
        });
      }
      getTotal(cart);

      const newOrder = new Order({
        userId: idUser,
        fullname,
        email: to,
        phone,
        address: address,
        products: cart.items,
        total: sub_total,
      });
      return newOrder.save();
    })
    .then(order => {
      const createdAt = new Date();
      const formattedDate = createdAt.toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      const mailGenerator = () => {
        return `
          <div style="max-width: 800px; margin: 0 auto; background-color: #1e1e1e; padding: 20px; color: white;">
            <h1>Xin Chào ${order.fullname}</h1>
            <p><strong>Phone:</strong> ${order.phone}</p>
            <p><strong>Address:</strong> ${order.address}</p>
            <p><strong>Order Time:</strong> ${formattedDate}</p>
            <table style="width: 100%; border-spacing: 2px; border-collapse: separate; margin-top: 20px;">
              <thead>
                <tr style="background-color: #333; text-align: center;">
                  <th style="border: 1px solid #a49987; padding: 10px;">Tên Sản Phẩm</th>
                  <th style="border: 1px solid #a49987; padding: 10px;">Hình Ảnh</th>
                  <th style="border: 1px solid #a49987; padding: 10px;">Giá</th>
                  <th style="border: 1px solid #a49987; padding: 10px;">Số Lượng</th>
                  <th style="border: 1px solid #a49987; padding: 10px;">Thành Tiền</th>
                </tr>
              </thead>
              <tbody>
                ${order.products
                  .map(
                    (prod, i) => `
                    <tr style="text-align: center;" key=${i}>
                      <td style="border: 1px solid #a49987; padding: 10px;">
                        ${prod.productId.name}
                      </td>
                      <td style="border: 1px solid #a49987; padding: 2px 0;">
                        <img
                          src="${prod.productId.img1}"
                          alt="${prod.productId.name}"
                          style="width: 60px;"
                        />
                      </td>
                      <td style="border: 1px solid #a49987; padding: 10px;">
                        ${prod.productId.price.toLocaleString('vi-VN')} VND
                      </td>
                      <td style="border: 1px solid #a49987; padding: 10px;">
                        ${prod.quantity}
                      </td>
                      <td style="border: 1px solid #a49987; padding: 10px;">
                        ${(prod.productId.price * prod.quantity).toLocaleString(
                          'vi-VN'
                        )} VND
                      </td>
                    </tr>
                  `
                  )
                  .join('')}  
              </tbody>
            </table>
            <h2 style="padding: 10px 0;">Tổng Thanh Toán: ${order.total.toLocaleString(
              'vi-VN'
            )} VND</h2>
            <h2 style="margin-top: 10px;">Cảm ơn bạn!</h2>
          </div>
        `;
      };

      // Generate an HTML email with the provided contents
      const emailBody = mailGenerator();

      transporter.sendMail(
        {
          from: '"Admin 👻" <anhtrangdep012@gmail.com>', // sender address
          to: to, // list of receivers
          subject: 'Confirm Your Order ✔', // Subject line
          text: 'Confirm Your Order ✔', // plain text body
          html: emailBody, // html body
        },
        (error, info) => {
          if (error) {
            return console.log('Error while sending mail: ' + error);
          } else {
            console.log('Message sent: %s', info.messageId);
          }
        }
      );
    })
    .then(() => {
      // order success -> xóa cart 
      Cart.findOneAndDelete({ userId: idUser }).then(() => {
        console.log('delete cart success!');
      });
    })
    .then(() => {
      res.status(200).json('you have order success!');
    })
    .catch(err => next(err));
};
