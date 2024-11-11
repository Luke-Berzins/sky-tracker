# Dockerfile
FROM node:16-alpine

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Create directory structure
RUN mkdir -p src/client/public/js \
    src/client/css \
    src/client/assets \
    src/server/config \
    src/server/routes \
    src/server/services

# Copy source files
COPY src ./src

EXPOSE 3000

CMD ["npm", "start"]