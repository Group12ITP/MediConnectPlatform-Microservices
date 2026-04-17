FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine
WORKDIR /app

# Create uploads directory and set proper permissions
RUN mkdir -p /app/uploads/reports && \
    chown -R node:node /app/uploads && \
    chmod -R 755 /app/uploads

# Copy dependencies and application code
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=node:node . .

# Ensure uploads directory has correct permissions after copy
RUN chown -R node:node /app/uploads && \
    chmod -R 755 /app/uploads

EXPOSE 5003
USER node
CMD ["node", "server.js"]