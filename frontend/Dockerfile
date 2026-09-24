# FROM node:20-alpine
# WORKDIR /app
# COPY package*.json ./
# RUN npm install
# COPY . .
# RUN npm run build
# EXPOSE 3000
# CMD ["npm", "start"]





# Stage 1: Dependencies
# FROM node:20-alpine AS deps
# WORKDIR /app
# COPY package*.json ./
# RUN npm ci

# # Stage 2: Builder
# FROM node:20-alpine AS builder
# WORKDIR /app
# COPY --from=deps /app/node_modules ./node_modules
# COPY . .
# # Set runtime environment variables during build time if needed
# ARG NEXT_PUBLIC_API_URL
# ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# RUN npm run build

# # Stage 3: Runner (Production)
# FROM node:20-alpine AS runner
# WORKDIR /app
# ENV NODE_ENV=production

# RUN addgroup --system --gid 1001 nodejs && \
#     adduser --system --uid 1001 nextjs

# # COPY --from=builder /app/public ./public
# COPY --from=builder /app/.next/standalone ./
# COPY --from=builder /app/.next/static ./.next/static

# USER nextjs

# EXPOSE 3000
# ENV PORT=3000
# CMD ["node", "server.js"]



# # Stage 1: Dependencies
# FROM node:20-alpine AS deps
# WORKDIR /app
# COPY package*.json ./
# RUN npm ci

# # Stage 2: Builder
# FROM node:20-alpine AS builder
# WORKDIR /app
# COPY --from=deps /app/node_modules ./node_modules
# COPY . .

# # Set runtime environment variables during build time
# ARG NEXT_PUBLIC_API_URL
# ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# # Ensure public folder exists so COPY step in Stage 3 never fails
# RUN mkdir -p public

# RUN npm run build

# # Stage 3: Runner (Production)
# FROM node:20-alpine AS runner
# WORKDIR /app
# ENV NODE_ENV=production

# RUN addgroup --system --gid 1001 nodejs && \
#     adduser --system --uid 1001 nextjs

# # Copy built assets
# COPY --from=builder /app/public ./public
# COPY --from=builder /app/.next/standalone ./
# COPY --from=builder /app/.next/static ./.next/static

# USER nextjs

# EXPOSE 3000
# ENV PORT=3000
# CMD ["node", "server.js"]


# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set runtime environment variables during build time
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Ensure public folder exists so COPY step in Stage 3 never fails
RUN mkdir -p public

RUN npm run build

# Stage 3: Runner (Production)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# CRITICAL FIX FOR NGINX: Bind Next.js to 0.0.0.0 so Nginx can reach it
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set correct permissions for Next.js standalone server
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]