const express = require('express');
const {
  getUserProfile,
  getProductProfile,
  getRecommendedProducts
} = require('../controllers/profileController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// 用户画像相关路由
router.get('/user', auth, getUserProfile);
router.get('/product/:id', auth, getProductProfile);
router.get('/recommendations', auth, getRecommendedProducts);

module.exports = router;