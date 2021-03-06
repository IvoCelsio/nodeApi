const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const checkAuth = require('../middleware/check-auth');

const Product = require('../models/product');
const ProductsController = require('../controllers/products');

const storage = multer.diskStorage({
   destination: function(req, file, cb) {
      cb(null, './uploads/');
   },
   filename: function(req, file, cb) {
      cb(null, file.originalname);
   }
});

const fileFilter = (req, file, cb) => {
   if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
   } else {
      cb(null, false);
   }
};

const upload = multer({
   storage: storage,
   limits: {
      fileSize: 1024 * 1024 * 5
   },
   fileFilter: fileFilter
});

router.get('/', ProductsController.products_get_all);

router.post(
   '/',
   checkAuth,
   upload.single('productImage'),
   ProductsController.products_create_product
);

router.get('/:productId', (req, res, next) => {
   const id = req.params.productId;
   Product.findById(id)
      .select('name price _id productImage')
      .exec()
      .then(doc => {
         console.log(doc);
         if (doc) {
            res.status(200).json({
               product: doc,
               request: {
                  type: 'GET',
                  url: 'http://localhost:5000/products/'
               }
            });
         } else {
            res.status(404).json({
               message: 'No valid entry found for provided ID'
            });
         }
      })
      .catch(err => {
         console.log(err);
         res.status(500).json({ error: err });
      });
});

router.patch('/:productId', checkAuth, (req, res, next) => {
   const id = req.params.productId;
   const updateOps = {};
   for (const ops of req.body) {
      updateOps[ops.propName] = ops.value;
   }
   Product.update({ _id: id }, { $set: updateOps })
      .exec()
      .then(result => {
         res.status(200).json({
            message: 'Product updated',
            request: {
               type: 'GET',
               url: 'http://localhost:5000/products/' + id
            }
         });
      })
      .catch(err => {
         console.log(err);
         res.status(500).json({ error: err });
      });
});

router.delete('/:productId', checkAuth, (req, res, next) => {
   const id = req.params.productId;
   Product.remove({ _id: id })
      .exec()
      .then(result => {
         res.status(200).json({
            message: 'Product deleted',
            request: {
               type: 'POST',
               url: 'http://localhost:5000/products/',
               body: { name: 'String', price: 'Number' }
            }
         });
      })
      .catch(err => {
         console.log(err);
         res.status(500).json({
            error: err
         });
      });
});

module.exports = router;
