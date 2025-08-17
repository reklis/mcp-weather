FROM node:lts-alpine AS builder

# Set working directory
WORKDIR /app

# Copy all files
COPY . .

# Install all dependencies (including dev)
RUN npm ci

# Build TypeScript
RUN npm run build

# Production stage
FROM node:lts-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies (skip prepare script)
RUN npm ci --omit=dev --ignore-scripts

# Copy built files from builder stage
COPY --from=builder /app/build ./build

# Expose port
EXPOSE 3000

# Set environment variable for port
ENV PORT=3000

# Run the HTTP server
CMD ["npm", "run", "start:http"]