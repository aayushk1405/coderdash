# Use the official Node.js image as a foundation
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install all dependencies (including mongoose)
RUN npm install

# Copy the rest of your backend code
COPY . .

# Expose the port your Express app runs on
EXPOSE 5000

# Command to start your server
CMD ["npm", "start"]
