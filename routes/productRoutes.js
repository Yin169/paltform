const express = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { auth, sellerAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', auth, sellerAuth, createProduct);
router.put('/:id', auth, sellerAuth, updateProduct);
router.delete('/:id', auth, sellerAuth, deleteProduct);

module.exports = router;