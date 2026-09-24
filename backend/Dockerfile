# FROM node:20-alpine
# WORKDIR /app
# COPY package*.json ./
# RUN npm install --production
# COPY . .
# EXPOSE 8000
# CMD ["node", "src/server.js"]




# # Stage 1: Build & Prune
# FROM node:20-alpine AS builder
# WORKDIR /app
# COPY package*.json ./
# RUN npm ci --only=production
# COPY . .

# # Stage 2: Production Runner
# FROM node:20-alpine AS runner
# WORKDIR /app
# ENV NODE_ENV=production

# # Non-root security user
# RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

# COPY --from=builder /app ./

# USER nodejs

# EXPOSE 8000
# CMD ["node", "src/server.js"]


# Stage 1: Build & Install
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Stage 2: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

COPY --from=builder /app ./

USER nodejs

EXPOSE 8000
CMD ["node", "src/server.js"]
