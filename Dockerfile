FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install --prefer-offline

COPY . .

EXPOSE 80

CMD ["npm", "start"]