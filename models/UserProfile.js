const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // 基本画像信息
  demographics: {
    ageGroup: {
      type: String,
      enum: ['18-25', '26-35', '36-45', '46-55', '55+', 'unknown']
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'unknown']
    },
    location: {
      city: String,
      state: String,
      country: String
    }
  },
  
  // 行为画像
  behavior: {
    purchaseFrequency: {
      type: Number, // 每月平均购买次数
      default: 0
    },
    avgOrderValue: {
      type: Number, // 平均订单价值
      default: 0
    },
    preferredCategories: [{
      type: String
    }],
    preferredBrands: [{
      type: String
    }],
    lastPurchaseDate: {
      type: Date
    },
    totalSpent: {
      type: Number,
      default: 0
    },
    cartAbandonmentRate: {
      type: Number, // 购物车放弃率
      default: 0
    }
  },
  
  // 偏好画像
  preferences: {
    communicationChannels: [{
      type: String,
      enum: ['email', 'sms', 'push', 'in-app']
    }],
    notificationPreferences: [{
      type: String,
      enum: ['promotions', 'order_updates', 'new_products', 'recommendations']
    }],
    priceSensitivity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },
  
  // 活跃度指标
  engagement: {
    daysActiveLast30: {
      type: Number, // 最近30天活跃天数
      default: 0
    },
    loginFrequency: {
      type: Number, // 每周登录频率
      default: 0
    },
    wishlistItems: {
      type: Number,
      default: 0
    }
  },
  
  // 用户价值评分
  valueScore: {
    type: Number, // 0-100分
    default: 0
  },
  
  // 用户生命周期状态
  lifecycleStage: {
    type: String,
    enum: ['new', 'active', 'at_risk', 'churned', 'vip'],
    default: 'new'
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// 更新时间戳
userProfileSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

module.exports = mongoose.model('UserProfile', userProfileSchema);