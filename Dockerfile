FROM node:15.7.0-alpine3.10
WORKDIR /usr/src/app
COPY . .
RUN npm ci
EXPOSE 80
CMD ["npm", "start"]
