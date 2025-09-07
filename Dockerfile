FROM node:lts-buster

# App Clone
RUN git clone https://github.com/qadeer-xmd/QADEER-MD /root/QADEER-MD
WORKDIR /root/QADEER-MD

# Dependencies
RUN npm install && npm install -g pm2

COPY . .

EXPOSE 8080

CMD ["npm", "start"]
