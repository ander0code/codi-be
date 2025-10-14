FROM node:20-alpine3.22

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 3000

USER node

CMD ["npm", "start"]