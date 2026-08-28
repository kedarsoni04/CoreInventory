FROM node:18

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm run install:all

# Copy the rest of the application
COPY . .

# Build the frontend
RUN npm run build

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=5000
# Database will be stored in a separate volume mount
ENV DB_PATH=/data/database.sqlite

# Create directory for SQLite database
RUN mkdir -p /data

EXPOSE 5000

# Start the backend server
CMD ["npm", "start"]
