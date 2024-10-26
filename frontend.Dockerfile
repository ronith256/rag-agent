FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3349

CMD ["npm", "run", "frontend"]
# CMD ["serve", "-s", "dist", "-l", "3000"]
# CMD ["npm", "run", "dev", "--", "--host"]