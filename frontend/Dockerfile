# Stage 1: Install dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ARG NEXT_PUBLIC_SEMESTER_START_DATE
ENV NEXT_PUBLIC_SEMESTER_START_DATE=$NEXT_PUBLIC_SEMESTER_START_DATE

ARG NEXT_PUBLIC_SEMESTER_END_DATE
ENV NEXT_PUBLIC_SEMESTER_END_DATE=$NEXT_PUBLIC_SEMESTER_END_DATE

ARG NEXT_PUBLIC_FIRST_SEMESTER_START
ENV NEXT_PUBLIC_FIRST_SEMESTER_START=$NEXT_PUBLIC_FIRST_SEMESTER_START

ARG NEXT_PUBLIC_FIRST_SEMESTER_END
ENV NEXT_PUBLIC_FIRST_SEMESTER_END=$NEXT_PUBLIC_FIRST_SEMESTER_END

ARG NEXT_PUBLIC_SECOND_SEMESTER_START
ENV NEXT_PUBLIC_SECOND_SEMESTER_START=$NEXT_PUBLIC_SECOND_SEMESTER_START

ARG NEXT_PUBLIC_SECOND_SEMESTER_END
ENV NEXT_PUBLIC_SECOND_SEMESTER_END=$NEXT_PUBLIC_SECOND_SEMESTER_END

# Build the application
RUN npm run build

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Set correct permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]
