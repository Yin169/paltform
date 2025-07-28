# 使用官方Node.js运行时作为基础镜像
FROM node:16

# 设置工作目录
WORKDIR /usr/src/app

# 复制package.json和package-lock.json（如果存在）
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制应用源代码
COPY . .

# 暴露端口
EXPOSE 3000

# 启动应用
CMD [ "npm", "start" ]