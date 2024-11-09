const Product = require('../models/product');
const mongoose = require('mongoose');
const { s3Uploadv3 } = require('../s3Service');

// GET all products
exports.getProducts = (req, res, next) => {
  Product.find()
    .then(product => res.status(200).json(product))
    .catch(err => next(err));
};

// GET detail product
exports.getProduct = (req, res, next) => {
  const idProduct = req.params.idProduct;
  Product.findOne({ _id: idProduct })
    .then(product => res.status(200).json(product))
    .catch(err => next(err));
};

// GET product -> category
exports.getCategory = (req, res, next) => {
  const { category, search } = req.query;

  if (search) {
    Product.find({ name: new RegExp(search, 'i') }) // (regular expression), 'i': không phân biệt chữ hoa chữ thường
      .then(product => {
        return res.status(200).json(product);
      })
      .catch(err => next(err));
  } else {
    if (category !== 'all') {
      Product.find({ category: category })
        .then(product => res.status(200).json(product))
        .catch(err => next(err));
    } else {
      Product.find()
        .then(product => {
          res.status(200).json(product);
        })
        .catch(err => next(err));
    }
  }
};

exports.postAddProduct = async (req, res, next) => {
  const { name, category, price, longDescription, shortDescription, count } =
    req.body;

  try {
    const uploadResults = await s3Uploadv3(req.files);

    const imageUrls = uploadResults.map(result => result.imageUrl);

    const newProduct = new Product({
      name,
      category,
      price: parseInt(price),
      long_desc: longDescription,
      short_desc: shortDescription,
      count,
      img1: imageUrls[0],
      img2: imageUrls[1],
      img3: imageUrls[2],
      img4: imageUrls[3],
      img5: imageUrls[4] || null,
    });

    await newProduct.save();

    return res.status(200).json({
      message: 'Files uploaded successfully',
      files: uploadResults, // send URLs to frontend
    });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ message: 'File upload or product creation failed', error: err });
  }
};

exports.updateProduct = (req, res, next) => {
  const { idProduct } = req.params;
  const { ...otherFields } = req.body;

  Product.findById(idProduct)
    .then(product => {
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      Object.assign(product, otherFields); //sao chép các giá trị từ các trường của đối tượng otherFields vào đối tượng product

      return product.save();
    })
    .then(updatedProduct => {
      res.status(200).json({
        message: 'Product updated successfully',
      });
    })
    .catch(err => next(new Error(err)));
};

exports.deleteProduct = (req, res, next) => {
  const { idProduct } = req.params;

  Product.findByIdAndDelete(idProduct)
    .then(prod => {
      if (!prod) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.status(200).json({ message: 'Product deleted successfully' });
    })
    .catch(err => next(new Error(err)));
};
