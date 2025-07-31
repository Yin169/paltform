const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'seller', 'admin'],
    default: 'user'
  },
  
  // 个人信息
  profile: {
    firstName: {
      type: String,
      trim: true
    },
    lastName: {
      type: String,
      trim: true
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    birthDate: {
      type: Date
    },
    phoneNumber: {
      type: String,
      trim: true
    }
  },
  
  // 地址信息
  addresses: [{
    type: {
      type: String,
      enum: ['home', 'work', 'billing', 'shipping'],
      default: 'home'
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    street: String,
    city: String,
    state: String,
    country: {
      type: String,
      default: '中国'
    },
    zipCode: String,
    recipientName: String,
    recipientPhone: String
  }],
  
  // 会员信息
  membership: {
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze'
    },
    points: {
      type: Number,
      default: 0
    },
    joinDate: {
      type: Date,
      default: Date.now
    }
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 添加索引
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });

// 密码加密中间件
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// 密码比较方法
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// 获取全名
UserSchema.virtual('fullName').get(function() {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.username;
});

// 确保虚拟字段被序列化已移至Schema选项中

module.exports = mongoose.model('User', UserSchema);