# -------------------------------
# 🚀 QADEER-MD Dockerfile
# Base Image
# -------------------------------
FROM node:lts-buster

# 📝 Maintainer Info
LABEL maintainer="Qadeer Brahvi <qadeer-xmd>"

# 🌍 Working Directory
WORKDIR /root/QADEER-MD

# 🔥 Clone your repo directly
RUN git clone https://github.com/qadeer-xmd/QADEER-MD.git .

# 📦 Install dependencies
RUN npm install --production && npm install -g pm2

# 🔁 Copy remaining files (if needed during rebuilds)
COPY . .

# 🌐 Expose port
EXPOSE 3000

# 🚀 Start the bot using PM2 for process management
CMD ["pm2-runtime", "index.js"]
