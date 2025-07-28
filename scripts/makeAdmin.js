const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');

dotenv.config();

// 连接到数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  makeAdmin();
})
.catch(err => {
  console.error('Failed to connect to MongoDB', err);
  process.exit(1);
});

async function makeAdmin() {
  const username = process.argv[2];
  
  if (!username) {
    console.log('请提供用户名作为参数');
    console.log('用法: node scripts/makeAdmin.js <用户名>');
    process.exit(1);
  }
  
  try {
    // 查找用户
    const user = await User.findOne({ username });
    
    if (!user) {
      console.log(`用户 "${username}" 未找到`);
      process.exit(1);
    }
    
    // 检查用户是否已经是管理员
    if (user.role === 'admin') {
      console.log(`用户 "${username}" 已经是管理员`);
      process.exit(0);
    }
    
    // 更新用户角色为管理员
    user.role = 'admin';
    await user.save();
    
    console.log(`用户 "${username}" 已成功设置为管理员`);
    process.exit(0);
  } catch (err) {
    console.error('设置管理员时出错:', err);
    process.exit(1);
  }
}