FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

RUN mkdir -p /app/uploads

COPY . .

EXPOSE 3000

CMD [ "npm", "run", "dev" ]