const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
  category: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  img1: { type: String, required: true },
  img2: { type: String, required: true },
  img3: { type: String, required: true },
  img4: { type: String, required: true },
  img5: { type: String },
  long_desc: { type: String, required: true },
  short_desc: { type: String, required: true },
  count: { type: Number, default: 0, min: 0, required: true },
});

module.exports = mongoose.model('Product', productSchema);
