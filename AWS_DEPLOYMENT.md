# AWS 部署指南

本文档详细说明了如何将电商交易平台部署到 AWS (Amazon Web Services) 上。AWS 提供了多种服务来部署应用，我们将介绍几种主要的部署方式。

## 部署选项

### 1. AWS Elastic Beanstalk (推荐新手)
Elastic Beanstalk 是一种易于使用的部署服务，支持多种编程语言，包括 Node.js。

### 2. AWS EC2
使用 EC2 虚拟机完全控制服务器环境。

### 3. AWS Fargate (容器化部署)
使用容器化技术部署应用，更现代化和可扩展。

### 4. AWS Lambda (无服务器)
将应用转换为无服务器架构。

## 方式一：使用 AWS Elastic Beanstalk 部署

### 准备工作

1. 安装 AWS CLI:
   ```bash
   pip install awscli
   ```

2. 配置 AWS 凭证:
   ```bash
   aws configure
   ```
   输入您的 AWS Access Key ID、Secret Access Key、区域和输出格式。

3. 安装 Elastic Beanstalk CLI:
   ```bash
   pip install awsebcli
   ```

### 配置应用

1. 在项目根目录创建 `.ebextensions` 目录:
   ```bash
   mkdir .ebextensions
   ```

2. 创建环境配置文件 `.ebextensions/environment.config`:
   ```yaml
   option_settings:
     aws:elasticbeanstalk:application:environment:
       NODE_ENV: production
       JWT_SECRET: your_jwt_secret_here
       MONGODB_URI: your_mongodb_connection_string
     aws:elasticbeanstalk:container:nodejs:
       ProxyServer: nginx
     aws:autoscaling:launchconfiguration:
       InstanceType: t2.micro
     aws:autoscaling:asg:
       MinSize: 1
       MaxSize: 1
   ```

3. 创建启动配置文件 `.ebextensions/01-setup.config`:
   ```yaml
   container_commands:
     01_install_deps:
       command: "npm install"
   ```

4. 创建 [Procfile](file:///Users/yincheangng/worksapce/Github/paltform/Procfile) 文件（如果不存在）:
   ```
   web: node src/server.js
   ```

### 部署步骤

1. 初始化 Elastic Beanstalk 应用:
   ```bash
   eb init
   ```
   - 选择区域
   - 选择应用名称
   - 选择平台为 Node.js

2. 创建开发环境并部署:
   ```bash
   eb create development
   ```

3. 打开应用:
   ```bash
   eb open
   ```

4. 后续部署:
   ```bash
   eb deploy
   ```

## 方式二：使用 AWS EC2 部署

### 准备工作

1. 在 AWS EC2 控制台创建一个实例（推荐使用 Amazon Linux 2 或 Ubuntu）

2. 配置安全组，开放端口：
   - SSH (22)
   - HTTP (80)
   - HTTPS (443)
   - 应用端口 (3000)

### 部署步骤

1. 连接到 EC2 实例:
   ```bash
   ssh -i your-key.pem ec2-user@your-instance-public-ip
   ```

2. 安装 Node.js:
   ```bash
   # Amazon Linux 2
   curl -o- https://raw.githubusercontent.com/nvm/sh/master/install.sh | bash
   . ~/.nvm/nvm.sh
   nvm install node
   ```

3. 安装 MongoDB 或使用 MongoDB Atlas:
   ```bash
   # 或者使用 MongoDB Atlas (推荐)
   # 注册 MongoDB Atlas 账户并创建集群
   ```

4. 上传应用代码:
   ```bash
   # 在本地机器上
   scp -i your-key.pem -r /path/to/your/app ec2-user@your-instance-public-ip:/home/ec2-user/app
   ```

5. 在 EC2 实例上安装依赖:
   ```bash
   cd /home/ec2-user/app
   npm install
   ```

6. 配置环境变量:
   ```bash
   # 创建 .env 文件
   cat > .env << EOF
   PORT=80
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRE=7d
   EOF
   ```

7. 使用 PM2 运行应用:
   ```bash
   # 安装 PM2
   npm install -g pm2
   
   # 启动应用
   pm2 start src/server.js --name ecommerce-app
   
   # 设置开机自启
   pm2 startup
   pm2 save
   ```

8. 配置 Nginx 反向代理（可选但推荐）:
   ```bash
   # 安装 Nginx
   sudo amazon-linux-extras install nginx1
   sudo systemctl start nginx
   sudo systemctl enable nginx
   
   # 配置反向代理
   sudo cat > /etc/nginx/conf.d/ecommerce.conf << EOF
   server {
     listen 80;
     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_cache_bypass $http_upgrade;
     }
   }
   EOF
   
   # 重启 Nginx
   sudo systemctl restart nginx
   ```

## 方式三：使用 AWS Fargate 部署（容器化）

### 准备工作

1. 确保项目根目录有 [Dockerfile](file:///Users/yincheangng/worksapce/Github/paltform/Dockerfile)（已创建）

2. 创建 ECR 仓库:
   ```bash
   aws ecr create-repository --repository-name ecommerce-platform
   ```

### 部署步骤

1. 构建并推送 Docker 镜像:
   ```bash
   # 获取登录命令
   aws ecr get-login-password --region your-region | docker login --username AWS --password-stdin your-account-id.dkr.ecr.your-region.amazonaws.com
   
   # 构建镜像
   docker build -t ecommerce-platform .
   
   # 标记镜像
   docker tag ecommerce-platform:latest your-account-id.dkr.ecr.your-region.amazonaws.com/ecommerce-platform:latest
   
   # 推送镜像
   docker push your-account-id.dkr.ecr.your-region.amazonaws.com/ecommerce-platform:latest
   ```

2. 创建 ECS 任务定义 `task-definition.json`:
   ```json
   {
     "family": "ecommerce-platform",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "256",
     "memory": "512",
     "executionRoleArn": "arn:aws:iam::your-account-id:role/ecsTaskExecutionRole",
     "containerDefinitions": [
       {
         "name": "ecommerce-platform",
         "image": "your-account-id.dkr.ecr.your-region.amazonaws.com/ecommerce-platform:latest",
         "portMappings": [
           {
             "containerPort": 3000,
             "protocol": "tcp"
           }
         ],
         "environment": [
           {
             "name": "NODE_ENV",
             "value": "production"
           },
           {
             "name": "JWT_SECRET",
             "value": "your_jwt_secret_here"
           },
           {
             "name": "MONGODB_URI",
             "value": "your_mongodb_connection_string"
           }
         ],
         "logConfiguration": {
           "logDriver": "awslogs",
           "options": {
             "awslogs-group": "/ecs/ecommerce-platform",
             "awslogs-region": "your-region",
             "awslogs-stream-prefix": "ecs"
           }
         }
       }
     ]
   }
   ```

3. 创建 ECS 服务:
   ```bash
   aws ecs create-service --service-name ecommerce-platform-service --cluster your-cluster-name --task-definition ecommerce-platform --desired-count 1 --launch-type FARGATE --network-configuration "awsvpcConfiguration={subnets=[subnet-1,subnet-2],securityGroups=[sg-1],assignPublicIp=ENABLED}"
   ```

## 方式四：使用 AWS Lambda 和 API Gateway（无服务器）

这种方式需要重构应用以适应无服务器架构，但可以获得更好的可扩展性和成本效益。

### 准备工作

1. 安装 Serverless Framework:
   ```bash
   npm install -g serverless
   ```

2. 配置 AWS 凭证:
   ```bash
   serverless config credentials --provider aws --key your-access-key --secret your-secret-key
   ```

### 部署步骤

1. 创建 [serverless.yml](file:///Users/yincheangng/worksapce/Github/paltform/serverless.yml) 配置文件:
   ```yaml
   service: ecommerce-platform
   
   provider:
     name: aws
     runtime: nodejs16.x
     region: us-east-1
     environment:
       JWT_SECRET: your_jwt_secret_here
       MONGODB_URI: your_mongodb_connection_string
   
   functions:
     app:
       handler: src/server.handler
       events:
         - http:
             path: /{proxy+}
             method: ANY
             cors: true
         - http:
             path: /
             method: ANY
             cors: true
   
   plugins:
     - serverless-http
   ```

2. 安装 serverless-http:
   ```bash
   npm install serverless-http
   ```

3. 修改服务器文件以适应 serverless:
   ```javascript
   const serverless = require('serverless-http');
   
   module.exports.handler = serverless(app);
   ```

4. 部署:
   ```bash
   serverless deploy
   ```

## 数据库选项

### 1. MongoDB Atlas (推荐)
MongoDB Atlas 是 MongoDB 官方提供的云数据库服务，易于使用和管理。

### 2. AWS DocumentDB
AWS 的 MongoDB 兼容数据库服务。

### 3. 在 EC2 实例上运行 MongoDB
在 EC2 实例上安装和运行 MongoDB。

## 环境变量配置

无论选择哪种部署方式，都需要配置以下环境变量：
- `JWT_SECRET`: JWT 加密密钥
- `MONGODB_URI`: MongoDB 连接字符串
- `PORT`: 应用监听端口（默认3000）
- `JWT_EXPIRE`: JWT 过期时间（可选）

## 域名和 SSL 证书

1. 在 AWS Route 53 中注册或转移域名
2. 使用 AWS Certificate Manager (ACM) 获取免费 SSL 证书
3. 配置 Route 53 将域名指向应用

## 监控和日志

1. 使用 CloudWatch 监控应用性能和日志
2. 设置警报以在应用出现问题时通知您
3. 使用 AWS X-Ray 进行分布式跟踪

## 成本优化

1. 使用 AWS Cost Explorer 分析和优化成本
2. 根据流量调整实例大小或使用自动扩展
3. 使用预留实例或 Savings Plans 降低成本

## 安全最佳实践

1. 使用 IAM 角色而不是访问密钥
2. 配置安全组以限制不必要的访问
3. 定期更新依赖包
4. 使用 AWS Secrets Manager 管理密钥
5. 启用 AWS CloudTrail 审计日志

## 故障排除

1. 检查 CloudWatch 日志
2. 确认安全组配置
3. 验证环境变量设置
4. 确认数据库连接
5. 检查 IAM 权限

通过以上任何一种方式，您都可以成功将电商平台部署到 AWS 上。推荐新手使用 Elastic Beanstalk，因为它最简单且自动化程度最高。