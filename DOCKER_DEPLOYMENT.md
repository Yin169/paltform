# Docker 部署指南

本文档详细说明了如何使用 Docker 和 Docker Compose 部署电商交易平台。

## 前提条件

在开始部署之前，请确保您已经安装了以下工具：

1. Docker (版本 18.09 或更高)
2. Docker Compose (版本 1.24 或更高)

## 部署步骤

### 1. 克隆代码库

```bash
git clone <repository-url>
cd platform
```

### 2. 配置环境变量

创建 `.env` 文件并设置必要的环境变量：

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置以下变量：

```
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_here
```

### 3. MongoDB Atlas 配置

要连接到 MongoDB Atlas，您需要：

1. 在 MongoDB Atlas 上创建集群
2. 获取连接字符串
3. 将连接字符串添加到 `.env` 文件的 `MONGODB_URI` 变量中

MongoDB Atlas 连接字符串格式如下：
```
mongodb+srv://<username>:<password>@<cluster-url>/<database>?retryWrites=true&w=majority
```

确保替换以下占位符：
- `<username>`: 您的 MongoDB 用户名
- `<password>`: 您的 MongoDB 密码
- `<cluster-url>`: 您的 MongoDB Atlas 集群 URL
- `<database>`: 您要连接的数据库名称

### 4. 构建和启动应用

使用 Docker Compose 启动应用：

```bash
docker-compose up -d
```

这将在后台启动应用，您可以通过 `http://localhost:3000` 访问它。

### 5. 生产环境部署

对于生产环境部署，使用 `docker-compose.prod.yml` 文件：

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Docker 配置说明

### Dockerfile

Dockerfile 定义了应用的基础镜像和构建步骤：

- 基于 node:16 镜像
- 工作目录设置为 `/usr/src/app`
- 先复制 package.json 并安装依赖，以利用 Docker 层缓存
- 复制应用源代码
- 暴露端口 3000
- 使用 `npm start` 启动应用

### docker-compose.yml

Docker Compose 文件定义了服务配置：

- 构建当前目录的 Dockerfile
- 映射端口 3000
- 设置环境变量
- 配置自动重启策略

## 环境变量

应用需要以下环境变量：

- `MONGODB_URI`: MongoDB Atlas 连接字符串
- `JWT_SECRET`: JSON Web Token 加密密钥
- `NODE_ENV`: 运行环境 (development/production)

## 常用命令

### 查看日志

```bash
docker-compose logs -f app
```

### 停止服务

```bash
docker-compose down
```

### 重新构建并启动

```bash
docker-compose up -d --build
```

### 扩展服务

```bash
docker-compose up -d --scale app=3
```

## 故障排除

### 权限问题

如果遇到权限问题，请确保 Docker 守护进程正在运行，并且您的用户具有访问 Docker 的权限。

### 端口冲突

如果端口 3000 已被占用，可以在 docker-compose.yml 中修改端口映射：

```yaml
ports:
  - "3001:3000"
```

### 数据持久化

图表和其他生成的文件将保存在 `public/graphs` 目录中，在生产环境中通过卷挂载确保数据持久化。

### MongoDB Atlas 连接问题

如果遇到 MongoDB Atlas 连接问题，请检查：

1. 连接字符串格式是否正确
2. 用户名和密码是否正确
3. IP 白名单是否已配置允许 Docker 容器访问
4. MongoDB Atlas 集群是否处于活动状态