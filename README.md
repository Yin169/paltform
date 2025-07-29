# 简易电商交易平台

这是一个使用 Node.js、Express 和 MongoDB 构建的简易电商交易平台。该平台提供了用户注册登录、商品管理、购物车和订单处理等核心电商功能。

## 功能特性

- 用户注册和登录（JWT认证）
- 商品浏览、添加、编辑和删除
- 购物车管理
- 订单创建和管理
- 管理员后台（订单和商品管理）

## 技术栈

- **后端**: Node.js, Express.js
- **数据库**: MongoDB with Mongoose
- **认证**: JWT (JSON Web Tokens)
- **前端**: HTML, CSS, JavaScript
- **部署**: GitHub Pages (前端), Heroku/Render/AWS (后端)

## 本地运行

### 环境要求

- Node.js >= 14.x
- MongoDB

## MongoDB Atlas 配置

要使用 MongoDB Atlas 云数据库，请按照以下步骤操作：

1. 在 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 上创建一个账户
2. 创建一个新的集群
3. 在 "Database Access" 部分创建一个数据库用户
4. 在 "Network Access" 部分添加你的 IP 地址到白名单（或者添加 `0.0.0.0/0` 以允许所有 IP）
5. 在 "Clusters" 部分点击 "Connect"，选择 "Connect your application"
6. 复制连接字符串并替换 `.env` 文件中的 `MONGODB_URI` 值
7. 将 `<username>` 和 `<password>` 替换为你创建的数据库用户的凭据

示例连接字符串:
```
mongodb+srv://yourUsername:yourPassword@cluster0.abc123.mongodb.net/ecommerce?retryWrites=true&w=majority
```

### 安装步骤

1. 克隆仓库:
   ```bash
   git clone https://github.com/yourusername/your-repo-name.git
   cd your-repo-name
   ```

2. 安装依赖:
   ```bash
   npm install
   ```

3. 配置环境变量:
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，填写必要的配置
   ```

4. 启动 MongoDB 服务

5. 启动应用:
   ```bash
   npm start
   ```

6. 访问应用:
   浏览器打开 `http://localhost:3000`

## 部署到Render

### 设置MongoDB Atlas数据库

由于Render不提供MongoDB数据库服务，您需要使用MongoDB Atlas（MongoDB官方云数据库服务）：

1. 访问 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 并创建一个免费账户
2. 创建一个新的集群（选择免费的M0沙盒计划）
3. 在"Network Access"中，将您的IP地址添加到允许列表（或者允许从任何地方访问 0.0.0.0/0 用于测试）
4. 在"Database Access"中创建一个数据库用户
5. 获取连接字符串：
   - 点击"Connect"按钮
   - 选择"Connect your application"
   - 选择Node.js驱动程序
   - 复制连接字符串

### 在Render上部署

1. 将代码推送到GitHub/GitLab/Bitbucket仓库
2. 登录Render并创建新的Web Service
3. 连接您的Git仓库
4. 配置以下设置：
   - Name: 为您的应用命名
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. 在Environment Variables中添加：
   - `MONGODB_URI`: 您的MongoDB Atlas连接字符串（记得替换<password>为实际密码）
   - `JWT_SECRET`: 您的JWT密钥
   - `NODE_ENV`: production
6. 点击"Create Web Service"开始部署

## 使用Docker运行

### 使用Docker Compose（推荐）

1. 确保已安装 Docker 和 Docker Compose

2. 构建并启动服务:
   ```bash
   docker-compose up -d
   ```

3. 访问应用:
   浏览器打开 `http://localhost:3000`

4. 停止服务:
   ```bash
   docker-compose down
   ```

### 使用单独的Docker镜像

1. 构建镜像:
   ```bash
   docker build -t ecommerce-platform .
   ```

2. 运行容器:
   ```bash
   docker run -p 3000:3000 --name ecommerce-platform ecommerce-platform
   ```

## 部署到 GitHub

### 方法一：前端静态页面部署到 GitHub Pages

1. 构建静态文件（如果使用构建工具）

2. 创建 `gh-pages` 分支:
   ```bash
   git checkout -b gh-pages
   ```

3. 推送到 GitHub:
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin gh-pages
   ```

4. 在 GitHub 仓库设置中启用 GitHub Pages:
   - 转到仓库的 Settings 页面
   - 找到 "Pages" 部分
   - 选择 `gh-pages` 分支作为源
   - 保存设置

### 方法二：使用 GitHub Actions 自动部署

1. 创建 `.github/workflows/deploy.yml` 文件:
   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [ main ]

   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2

         - name: Setup Node.js
           uses: actions/setup-node@v2
           with:
             node-version: '16'

         - name: Install dependencies
           run: npm install

         - name: Build project
           run: npm run build # 如果有构建步骤

         - name: Deploy to GitHub Pages
           uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./public # 静态文件目录
   ```

## 后端部署

由于这是一个需要数据库和服务器的全栈应用，后端不能直接部署到 GitHub Pages。您可以选择以下平台：

### Heroku 部署步骤:

1. 安装 Heroku CLI 并登录:
   ```bash
   heroku login
   ```

2. 创建 Heroku 应用:
   ```bash
   heroku create your-app-name
   ```

3. 设置环境变量:
   ```bash
   heroku config:set JWT_SECRET=your_jwt_secret_here
   heroku config:set MONGODB_URI=your_mongodb_connection_string
   ```

4. 部署应用:
   ```bash
   git push heroku main
   ```

### Render 部署步骤:

1. 注册 [Render](https://render.com/) 账户

2. 连接 GitHub 仓库

3. 创建 Web Service:
   - 选择你的仓库
   - 设置构建命令: `npm install`
   - 设置启动命令: `npm start`
   - 添加环境变量

### AWS 部署

查看 [AWS_DEPLOYMENT.md](file:///Users/yincheangng/worksapce/Github/paltform/AWS_DEPLOYMENT.md) 获取详细的 AWS 部署说明，包括：
- Elastic Beanstalk 部署（推荐新手）
- EC2 部署
- Fargate 容器化部署
- Lambda 无服务器部署

## 管理员权限设置

注册普通用户后，可以通过以下命令将其设置为管理员:

```bash
npm run make:admin <用户名>
```

## API 接口文档

### 用户相关
- `POST /api/users/register` - 用户注册
- `POST /api/users/login` - 用户登录
- `GET /api/users/profile` - 获取用户信息

### 商品相关
- `GET /api/products` - 获取所有商品
- `GET /api/products/:id` - 获取单个商品
- `POST /api/products` - 创建商品 (需认证)
- `PUT /api/products/:id` - 更新商品 (需认证)
- `DELETE /api/products/:id` - 删除商品 (需认证)

### 订单相关
- `POST /api/orders` - 创建订单 (需认证)
- `GET /api/orders` - 获取用户订单 (需认证)
- `GET /api/orders/:id` - 获取订单详情 (需认证)
- `PUT /api/orders/:id/status` - 更新订单状态 (需认证)

### 购物车相关
- `GET /api/cart` - 获取购物车 (需认证)
- `POST /api/cart/add` - 添加商品到购物车 (需认证)
- `PUT /api/cart/update` - 更新购物车商品数量 (需认证)
- `DELETE /api/cart/remove` - 从购物车移除商品 (需认证)
- `DELETE /api/cart/clear` - 清空购物车 (需认证)

## 项目结构

```
.
├── controllers/          # 控制器
├── middleware/           # 中间件
├── models/               # 数据模型
├── public/               # 静态文件
├── routes/               # 路由
├── src/                  # 主应用入口
├── scripts/              # 脚本文件
├── .env.example          # 环境变量示例
├── .gitignore            # Git忽略文件
└── README.md             # 项目说明文件
```

## 开发指南

### 添加新功能

1. 在 `models/` 目录下创建数据模型
2. 在 `controllers/` 目录下创建控制器
3. 在 `routes/` 目录下创建路由
4. 在 `src/server.js` 中注册路由

## 许可证

本项目仅供学习和参考使用。