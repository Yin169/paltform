# Render 部署指南

本文档详细说明了如何在 Render 平台上部署电商交易平台。

## Render 平台简介

Render 是一个现代化的云平台，用于直接从 Git 仓库部署应用。它支持自动部署、自定义域名、SSL 证书、环境变量等特性。Render 提供免费和付费套餐，适合各种规模的项目。

需要注意的是，**Render 平台目前不支持 docker-compose.yml 文件**。Render 使用自己的配置文件格式，即 `render.yaml`，来定义服务、计划任务和静态站点。

## 部署配置

由于 Render 不支持 docker-compose，我们需要使用 Render 支持的部署方式。以下是配置步骤：

### 1. 创建 render.yaml 文件

在项目根目录创建 `render.yaml` 文件：

```yaml
services:
  - type: web
    name: ecommerce-platform
    env: node
    plan: free
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        sync: false
```

### 2. 环境变量配置

Render 支持通过仪表板或 CLI 设置环境变量。对于敏感信息如 `MONGODB_URI` 和 `JWT_SECRET`，建议在 Render 仪表板中手动设置：

1. 登录 Render 仪表板
2. 进入您的服务设置页面
3. 找到 "Environment" 部分
4. 添加以下环境变量：
   - `MONGODB_URI`: 您的 MongoDB 连接字符串
   - `JWT_SECRET`: 您的 JWT 加密密钥

### 3. 部署步骤

1. 将代码推送到您的 Git 仓库（GitHub、GitLab 等）
2. 登录 Render (https://render.com)
3. 点击 "New+" 并选择 "Web Service"
4. 连接您的 Git 仓库
5. 填写服务信息：
   - Name: 选择一个名称
   - Region: 选择离您最近的区域
   - Branch: 选择部署分支（通常是 main 或 master）
   - Root Directory: 如果项目不在根目录，请指定路径
6. 构建选项：
   - Environment: Node
   - Build command: `npm install`
   - Start command: `npm start`
7. 点击 "Advanced" 并添加环境变量
8. 点击 "Create Web Service"

### 4. 自动部署

Render 支持通过 Git 推送自动部署：

1. 默认情况下，每次推送到指定分支都会触发部署
2. 您可以在服务设置中配置自动部署选项
3. Render 会自动运行构建命令并启动应用

## Render 特定配置

### render.yaml 文件详解

`render.yaml` 是 Render 的配置文件，用于定义服务和设置。以下是一个完整的配置示例：

```yaml
services:
  - type: web
    name: ecommerce-platform
    env: node
    plan: starter
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /api/products
    restartPolicyType: always
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        sync: false

preDeployCommands:
  - echo "Running pre-deploy scripts"
  - npm run migrate
```

### 环境变量

Render 提供了几种设置环境变量的方式：

1. 在 `render.yaml` 中直接定义（适用于非敏感信息）
2. 在 Render 仪表板中设置（适用于敏感信息）
3. 通过 CLI 同步本地环境变量

### 健康检查

Render 支持健康检查以确保应用正常运行：

```yaml
services:
  - type: web
    name: ecommerce-platform
    healthCheckPath: /api/products
    env: node
    # ... 其他配置
```

### 自定义域名和 SSL

Render 自动为您的服务提供免费的 SSL 证书：

1. 在服务设置中找到 "Custom Domains" 部分
2. 添加您的自定义域名
3. 按照指示配置 DNS 记录
4. Render 会自动申请并配置 SSL 证书

## 与 docker-compose 的区别

| 特性 | docker-compose | Render |
|------|----------------|--------|
| 配置文件 | docker-compose.yml | render.yaml |
| 环境变量 | .env 文件或 docker-compose.yml 中定义 | Render 仪表板或 render.yaml |
| 部署方式 | 本地运行或云服务器 | Git 集成自动部署 |
| 扩展性 | 手动扩展服务 | Render 自动扩展（付费功能） |
| 监控 | 第三方工具 | 内置日志和监控 |

## 常见问题和解决方案

### 1. 构建失败

如果构建失败，请检查：

1. package.json 中的脚本是否正确
2. 依赖是否完整
3. Node.js 版本是否兼容

### 2. 应用启动失败

如果应用启动失败，请检查：

1. 环境变量是否正确设置
2. MongoDB 连接字符串是否有效
3. 端口是否正确绑定到 Render 提供的 PORT 环境变量

### 3. 数据库连接问题

确保：

1. MongoDB URI 格式正确
2. 数据库允许来自 Render 的连接
3. 防火墙规则已正确配置

## 最佳实践

1. 使用环境变量管理配置
2. 在 render.yaml 中定义所有非敏感配置
3. 使用 Render 的健康检查功能
4. 定期查看日志以监控应用状态
5. 使用免费计划进行测试，生产环境考虑付费计划