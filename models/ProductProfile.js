const mongoose = require('mongoose');

const productProfileSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    unique: true
  },
  
  // 销售表现指标
  salesMetrics: {
    totalSold: {
      type: Number,
      default: 0
    },
    monthlySales: [{
      month: {
        type: Date
      },
      quantity: {
        type: Number,
        default: 0
      },
      revenue: {
        type: Number,
        default: 0
      }
    }],
    avgMonthlySales: {
      type: Number,
      default: 0
    },
    salesRank: {
      type: Number // 在同类商品中的销售排名
    },
    salesTrend: {
      type: String,
      enum: ['increasing', 'decreasing', 'stable', 'new'],
      default: 'new'
    }
  },
  
  // 用户行为数据
  userBehavior: {
    viewCount: {
      type: Number,
      default: 0
    },
    addToCartCount: {
      type: Number,
      default: 0
    },
    purchaseCount: {
      type: Number,
      default: 0
    },
    wishlistAdditions: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number, // 从浏览到购买的转化率
      default: 0
    }
  },
  
  // 评价和反馈
  ratings: {
    averageRating: {
      type: Number,
      default: 0
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    ratingDistribution: {
      oneStar: { type: Number, default: 0 },
      twoStar: { type: Number, default: 0 },
      threeStar: { type: Number, default: 0 },
      fourStar: { type: Number, default: 0 },
      fiveStar: { type: Number, default: 0 }
    }
  },
  
  // 库存和价格表现
  inventoryMetrics: {
    stockTurnoverRate: {
      type: Number,
      default: 0
    },
    daysOfSupply: {
      type: Number
    },
    pricePerformance: {
      originalPrice: Number,
      currentPrice: Number,
      discountPercentage: Number,
      priceChangeCount: {
        type: Number,
        default: 0
      }
    }
  },
  
  // 季节性和趋势
  seasonality: {
    seasonal: {
      type: Boolean,
      default: false
    },
    peakSeasons: [{
      type: String
    }],
    bestSellingPeriods: [{
      type: String
    }]
  },
  
  // 商品分类标签
  tags: [{
    type: String
  }],
  
  // 相关商品
  relatedProducts: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    correlationScore: {
      type: Number // 关联度分数
    }
  }],
  
  // 商品生命周期
  lifecycle: {
    stage: {
      type: String,
      enum: ['introduction', 'growth', 'maturity', 'decline'],
      default: 'introduction'
    },
    daysInMarket: {
      type: Number
    }
  },
  
  // 商品价值评分
  popularityScore: {
    type: Number, // 0-100分
    default: 0
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 更新时间戳
productProfileSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// 在查找时填充产品信息的中间件
productProfileSchema.pre(/^find/, function(next) {
  this.populate('product', 'name price category');
  next();
});

module.exports = mongoose.model('ProductProfile', productProfileSchema);