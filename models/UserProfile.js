const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // 人口统计学信息
  demographics: {
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'unknown'],
      default: 'unknown'
    },
    age: {
      type: Number,
      min: 0,
      max: 120
    },
    ageGroup: {
      type: String,
      enum: ['0-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+', 'unknown'],
      default: 'unknown'
    },
    occupation: {
      type: String,
      trim: true
    },
    incomeLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'unknown'],
      default: 'unknown'
    }
  },
  
  // 地理位置信息
  location: {
    homeAddress: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    },
    currentAddress: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    },
    frequentlyVisitedLocations: [{
      name: String,
      address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String
      },
      visitFrequency: Number
    }]
  },
  
  // 行为数据
  behavior: {
    totalSpent: {
      type: Number,
      default: 0
    },
    purchaseFrequency: {
      type: Number,
      default: 0
    },
    avgOrderValue: {
      type: Number,
      default: 0
    },
    cartAbandonmentRate: {
      type: Number,
      default: 0
    },
    preferredCategories: [{
      type: String
    }],
    lastPurchaseDate: Date,
    firstPurchaseDate: Date,
    activeDays: {
      type: Number,
      default: 0
    }
  },
  
  // 偏好设置
  preferences: {
    priceSensitivity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    favoriteBrands: [{
      type: String
    }],
    preferredPaymentMethods: [{
      type: String
    }],
    preferredShoppingChannels: [{
      type: String,
      enum: ['web', 'mobile', 'app', 'in_store']
    }],
    communicationPreferences: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      },
      push: {
        type: Boolean,
        default: false
      }
    }
  },
  
  // 生命周期指标
  lifecycleStage: {
    type: String,
    enum: ['new', 'active', 'at_risk', 'churned', 'vip'],
    default: 'new'
  },
  
  // 价值评分
  valueScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // RFM指标 (最近购买时间、购买频率、购买金额)
  rfm: {
    recency: Number,
    frequency: Number,
    monetary: Number
  },
  
  // 购买喜好
  purchasePreferences: {
    favoriteCategories: [{
      category: String,
      purchaseCount: Number,
      totalSpent: Number
    }],
    seasonalBuyingPatterns: [{
      season: String,
      purchaseCount: Number,
      totalSpent: Number
    }],
    timeOfDayPreferences: [{
      timeRange: String, // e.g., "09:00-12:00"
      purchaseCount: Number
    }],
    devicePreferences: [{
      device: String, // e.g., "mobile", "desktop", "tablet"
      purchaseCount: Number
    }]
  },
  
  // 社交属性
  social: {
    socialMediaPresence: [{
      platform: String,
      username: String
    }],
    influenceScore: {
      type: Number,
      min: 0,
      max: 100
    },
    referredUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  
  // 忠诚度指标
  loyalty: {
    membershipTier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze'
    },
    pointsBalance: {
      type: Number,
      default: 0
    },
    rewardsRedeemed: [{
      reward: String,
      date: Date,
      points: Number
    }]
  },
  
  // 更新时间
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 索引
userProfileSchema.index({ user: 1 });
userProfileSchema.index({ 'demographics.ageGroup': 1 });
userProfileSchema.index({ 'demographics.gender': 1 });
userProfileSchema.index({ 'behavior.totalSpent': -1 });
userProfileSchema.index({ valueScore: -1 });

module.exports = mongoose.model('UserProfile', userProfileSchema);