const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { updateUserProfile, updateProductProfile } = require('../controllers/profileController');
const graphService = require('../services/graphService');

class Simulator {
  // 生成随机用户名
  generateRandomUsername() {
    const prefixes = ['user', 'client', 'customer', 'buyer', 'shopper', 'member', 'vip'];
    const suffixes = ['123', '456', '789', 'abc', 'xyz', 'def', 'vip', 'pro'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const randomNumber = Math.floor(Math.random() * 10000);
    return `${randomPrefix}_${randomSuffix}_${randomNumber}`;
  }

  // 生成随机邮箱
  generateRandomEmail(username) {
    const domains = ['example.com', 'test.com', 'demo.com', 'shop.com', 'store.com', 'market.com'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${username}@${domain}`;
  }

  // 生成随机密码
  generateRandomPassword() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // 生成随机商品名称
  generateRandomProductName() {
    const categories = ['电子', '服装', '家居', '图书', '运动', '美妆', '食品', '玩具', '数码', '办公'];
    const types = ['智能手机', 'T恤', '沙发', '小说', '跑鞋', '口红', '巧克力', '积木', '笔记本电脑', '办公椅'];
    const brands = ['品牌A', '品牌B', '品牌C', '品牌D', '优质', '精品', '豪华', '专业'];
    const adjectives = ['豪华', '经典', '新款', '限量版', '专业', '便携', '智能', '时尚', '高性能', '多功能'];
    
    const category = categories[Math.floor(Math.random() * categories.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    
    return `${brand}${adjective}${type}`;
  }

  // 生成随机商品描述
  generateRandomProductDescription(name) {
    const descriptions = [
      `高质量的${name}，为您带来卓越的使用体验。精心设计，品质保证。`,
      `精心设计的${name}，满足您的日常需求。创新技术，值得信赖。`,
      `创新技术打造的${name}，性能出众。时尚美观，提升您的生活品质。`,
      `实用性强的${name}，是您不可或缺的选择。质量可靠，售后服务完善。`,
      `${name}，结合了最新的科技与人性化设计，为您提供完美的使用体验。`
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  // 生成随机地址
  generateRandomAddress() {
    const streets = ['中山路', '解放路', '人民路', '建设路', '和平路', '长安街', '南京路', '淮海路'];
    const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆'];
    const states = ['北京市', '上海市', '广东省', '浙江省', '四川省', '湖北省', '陕西省', '江苏省', '重庆市'];
    
    return {
      street: `${Math.floor(Math.random() * 1000)}号${streets[Math.floor(Math.random() * streets.length)]}`,
      city: cities[Math.floor(Math.random() * cities.length)],
      state: states[Math.floor(Math.random() * states.length)],
      zipCode: `${Math.floor(100000 + Math.random() * 900000)}`,
      country: '中国'
    };
  }

  // 生成随机个人信息
  generateRandomProfile() {
    const genders = ['male', 'female'];
    const occupations = ['工程师', '教师', '医生', '设计师', '销售', '学生', '自由职业者', '其他', '程序员', '经理'];
    
    // 生成随机出生日期 (18-65岁之间)
    const today = new Date();
    const startYear = today.getFullYear() - 65;
    const endYear = today.getFullYear() - 18;
    const birthYear = Math.floor(Math.random() * (endYear - startYear + 1)) + startYear;
    const birthMonth = Math.floor(Math.random() * 12);
    const birthDay = Math.floor(Math.random() * 28) + 1;
    const birthDate = new Date(birthYear, birthMonth, birthDay);
    
    return {
      gender: genders[Math.floor(Math.random() * genders.length)],
      birthDate: birthDate,
      occupation: occupations[Math.floor(Math.random() * occupations.length)],
      phoneNumber: `1${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 100000000)}`
    };
  }

  // 创建随机用户
  async createRandomUser(role = 'user') {
    try {
      const username = this.generateRandomUsername();
      const email = this.generateRandomEmail(username);
      const password = this.generateRandomPassword();
      const profile = this.generateRandomProfile();
      const addresses = [this.generateRandomAddress()];
      
      // 随机设置地址类型
      addresses[0].type = 'home';
      addresses[0].isDefault = true;
      
      const user = new User({
        username,
        email,
        password,
        profile,
        addresses,
        role
      });
      
      await user.save();
      console.log(`创建${role === 'seller' ? '卖家' : '用户'}: ${username}`);
      return user;
    } catch (error) {
      console.error('创建随机用户失败:', error);
      return null;
    }
  }

  // 创建随机商品
  async createRandomProduct(seller) {
    try {
      const name = this.generateRandomProductName();
      const description = this.generateRandomProductDescription(name);
      const categories = ['电子', '服装', '家居', '图书', '运动', '美妆', '食品', '玩具', '数码', '办公'];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const price = parseFloat((Math.random() * 2000 + 10).toFixed(2)); // 10-2010元
      const quantity = Math.floor(Math.random() * 200) + 1; // 1-200件库存
      
      const product = new Product({
        name,
        description,
        price,
        category,
        quantity,
        seller: seller._id
      });
      
      await product.save();
      console.log(`创建商品: ${name} (¥${price})`);
      return product;
    } catch (error) {
      console.error('创建随机商品失败:', error);
      return null;
    }
  }

  // 模拟用户浏览商品
  async simulateUserViewing(user, product) {
    try {
      // 更新图谱中的浏览关系
      const userNode = await graphService.upsertUserNode(user);
      const productNode = await graphService.upsertProductNode(product);
      await graphService.upsertViewRelationship(userNode, productNode);
      
      console.log(`用户 ${user.username} 浏览了商品 ${product.name}`);
      return true;
    } catch (error) {
      console.error('模拟用户浏览失败:', error);
      return false;
    }
  }

  // 模拟用户添加商品到购物车
  async simulateUserAddingToCart(user, product) {
    try {
      // 创建或获取购物车
      let cart = await Cart.findOne({ user: user._id });
      
      if (!cart) {
        cart = new Cart({
          user: user._id,
          items: []
        });
      }
      
      // 添加商品到购物车
      const quantity = Math.floor(Math.random() * 5) + 1; // 1-5件
      cart.items.push({
        product: product._id,
        quantity
      });
      
      await cart.save();
      
      // 更新用户画像
      await updateUserProfile(user._id);
      
      // 更新图谱中的加购关系
      const userNode = await graphService.upsertUserNode(user);
      const productNode = await graphService.upsertProductNode(product);
      await graphService.upsertCartRelationship(userNode, productNode);
      
      console.log(`用户 ${user.username} 将商品 ${product.name} x${quantity} 加入购物车`);
      return true;
    } catch (error) {
      console.error('模拟用户加购失败:', error);
      return false;
    }
  }

  // 模拟用户下单
  async simulateUserOrder(user, products) {
    try {
      // 构建订单项
      const orderItems = [];
      let totalAmount = 0;
      
      for (const product of products) {
        const quantity = Math.floor(Math.random() * 5) + 1; // 1-5件
        orderItems.push({
          product: product._id,
          quantity,
          price: product.price
        });
        totalAmount += product.price * quantity;
      }
      
      // 创建订单
      const order = new Order({
        user: user._id,
        items: orderItems,
        totalAmount,
        shippingAddress: this.generateRandomAddress()
      });
      
      await order.save();
      
      // 更新商品库存
      for (const item of orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { quantity: -item.quantity }
        });
      }
      
      // 更新用户和商品画像
      await updateUserProfile(user._id);
      for (const item of orderItems) {
        await updateProductProfile(item.product);
      }
      
      // 更新图谱中的购买关系
      const userNode = await graphService.upsertUserNode(user);
      for (const item of orderItems) {
        const product = await Product.findById(item.product);
        if (product) {
          const productNode = await graphService.upsertProductNode(product);
          await graphService.upsertPurchaseRelationship(userNode, productNode, item);
        }
      }
      
      console.log(`用户 ${user.username} 下单成功，订单金额: ¥${totalAmount.toFixed(2)}`);
      return order;
    } catch (error) {
      console.error('模拟用户下单失败:', error);
      return null;
    }
  }

  // 模拟用户取消订单
  async simulateUserCancelOrder(order) {
    try {
      // 更新订单状态为已取消
      order.status = 'cancelled';
      await order.save();
      
      // 恢复商品库存
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { quantity: item.quantity }
        });
      }
      
      console.log(`用户取消订单: ${order._id}`);
      return true;
    } catch (error) {
      console.error('模拟用户取消订单失败:', error);
      return false;
    }
  }

  // 模拟用户评价商品
  async simulateUserReview(user, product, rating) {
    try {
      // 在实际应用中，这里会创建评价记录
      console.log(`用户 ${user.username} 给商品 ${product.name} 评分为 ${rating} 星`);
      return true;
    } catch (error) {
      console.error('模拟用户评价失败:', error);
      return false;
    }
  }

  // 运行完整模拟
  async runSimulation(options = {}) {
    try {
      const {
        userCount = 10,
        sellerCount = 2,
        productCount = 20,
        viewProbability = 0.8,
        cartProbability = 0.4,
        orderProbability = 0.3,
        cancelProbability = 0.1,
        maxProductsPerOrder = 5
      } = options;
      
      console.log('开始模拟用户行为...');
      
      // 创建随机用户（包括卖家）
      console.log(`创建 ${userCount} 个随机用户和 ${sellerCount} 个卖家...`);
      const users = [];
      const sellers = [];
      
      // 创建卖家
      for (let i = 0; i < sellerCount; i++) {
        const seller = await this.createRandomUser('seller');
        if (seller) {
          sellers.push(seller);
        }
      }
      
      // 创建普通用户
      for (let i = 0; i < userCount; i++) {
        const user = await this.createRandomUser('user');
        if (user) {
          users.push(user);
        }
      }
      
      const allUsers = [...users, ...sellers];
      
      if (allUsers.length === 0) {
        console.log('没有创建任何用户');
        return;
      }
      
      // 创建随机商品
      console.log(`创建 ${productCount} 个随机商品...`);
      const products = [];
      for (let i = 0; i < productCount; i++) {
        // 随机选择一个卖家
        const seller = sellers[Math.floor(Math.random() * sellers.length)] || allUsers[0];
        const product = await this.createRandomProduct(seller);
        if (product) {
          products.push(product);
        }
      }
      
      if (products.length === 0) {
        console.log('没有创建任何商品');
        return;
      }
      
      // 模拟用户行为
      console.log('模拟用户行为...');
      for (const user of allUsers) {
        // 随机选择要交互的商品
        const productsToInteract = products.filter(() => Math.random() < 0.6);
        
        for (const product of productsToInteract) {
          // 模拟浏览
          if (Math.random() < viewProbability) {
            await this.simulateUserViewing(user, product);
          }
          
          // 模拟加购
          if (Math.random() < cartProbability) {
            await this.simulateUserAddingToCart(user, product);
          }
        }
        
        // 模拟下单
        if (Math.random() < orderProbability && productsToInteract.length > 0) {
          // 随机选择订单中的商品
          const orderProducts = productsToInteract
            .sort(() => 0.5 - Math.random())
            .slice(0, Math.floor(Math.random() * maxProductsPerOrder) + 1);
          
          if (orderProducts.length > 0) {
            const order = await this.simulateUserOrder(user, orderProducts);
            
            // 模拟订单取消
            if (order && Math.random() < cancelProbability) {
              await this.simulateUserCancelOrder(order);
            }
            
            // 模拟商品评价
            if (order && order.status !== 'cancelled') {
              for (const item of order.items) {
                const product = products.find(p => p._id.toString() === item.product.toString());
                if (product) {
                  const rating = Math.floor(Math.random() * 5) + 1; // 1-5星
                  await this.simulateUserReview(user, product, rating);
                }
              }
            }
          }
        }
      }
      
      // 构建图谱
      console.log('构建图谱数据...');
      await graphService.buildFullGraph();
      
      console.log('模拟完成！');
    } catch (error) {
      console.error('模拟过程中出现错误:', error);
    }
  }
}

module.exports = new Simulator();