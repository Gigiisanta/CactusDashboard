FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=20s --start-period=120s --retries=5 \
    CMD curl -f http://localhost:3000 || exit 1

# Start the development server
CMD ["node_modules/.bin/next", "dev", "-p", "3000"]