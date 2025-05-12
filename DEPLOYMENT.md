# POS System Deployment Guide

This document explains how to deploy the POS system so it can be accessed from other devices on your network or the internet.

## Quick Deployment (Local Network)

For quickly deploying the application on your local network so other devices can connect:

1. Clone or download the repository
2. Run the deployment script:

```bash
./deploy.sh
```

3. Access the application from other devices on your network using the URL displayed at the end of the deployment script (typically http://YOUR_IP_ADDRESS:3000)

## Alternative Access Methods

If you're having trouble accessing the system from other devices, try these alternative approaches:

### Method 1: Direct API Server Access

The simplest approach is to access the API server directly, which serves both the API and static files:

```bash
# Stop all running servers
pm2 stop all

# Start only the server
cd server
pm2 start src/index.js --name pos-server
```

Then access the application at: `http://YOUR_SERVER_IP:5000`

### Method 2: Using Nginx as a Reverse Proxy

For more reliable access, especially across different networks, use Nginx:

1. Install Nginx on the client device:

   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. Copy the provided Nginx configuration:

   ```bash
   # Update the IP address in the config file
   sudo cp nginx-pos.conf /etc/nginx/sites-available/
   sudo ln -s /etc/nginx/sites-available/nginx-pos.conf /etc/nginx/sites-enabled/
   ```

3. Edit your hosts file:

   ```bash
   sudo nano /etc/hosts
   ```

   Add this line:

   ```
   YOUR_SERVER_IP pos.local
   ```

4. Restart Nginx:

   ```bash
   sudo systemctl restart nginx
   ```

5. Access the application at `http://pos.local`

## Detailed Deployment Process

### Prerequisites

- Node.js (v14 or higher) installed on your server
- MongoDB installed (or access to a MongoDB instance)
- Git (for cloning the repository)

### Step 1: Clone and setup the repository

```bash
# Clone the repository
git clone <repository-url>
cd pos-system

# Install dependencies
npm run install-all
```

### Step 2: Configure the database

You have several options for MongoDB:

1. **Local MongoDB Installation**

   - Follow the [MongoDB installation guide](https://www.mongodb.com/docs/manual/installation/) for your OS
   - Start MongoDB: `sudo systemctl start mongod`

2. **MongoDB Atlas (Cloud)**

   - Create an account at [MongoDB Atlas](https://www.mongodb.com/atlas/database)
   - Create a new cluster
   - Get your connection string
   - Update the `MONGO_URI` in `server/.env` with your Atlas connection string

3. **Docker**
   - With Docker installed, run:
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

### Step 3: Configure environment settings

Create a `.env` file in the `server` directory:

```bash
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb://localhost:27017/gaming-store-pos
JWT_SECRET=your_secure_jwt_secret_key_change_this
JWT_EXPIRE=1d
JWT_COOKIE_EXPIRE=1
```

Be sure to change the `JWT_SECRET` to a strong, unique value.

### Step 4: Build the client

```bash
cd client
npm run build
cd ..
```

### Step 5: Deploy the application

Using PM2 (recommended for production):

```bash
# Install PM2 if not already installed
npm install -g pm2

# Start the server
cd server
pm2 start src/index.js --name pos-server
cd ..

# Set up auto-start on system boot
pm2 startup
pm2 save
```

### Step 6: Access the application

- From devices on your local network:
  - http://YOUR_SERVER_IP:5000

## Internet Access (Public Deployment)

For public internet access, additional steps are needed:

1. Set up a domain name pointing to your server
2. Configure a reverse proxy (Nginx or Apache) to forward requests
3. Set up SSL certificates (using Let's Encrypt)
4. Configure proper firewall rules

**Sample Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name your-pos-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Troubleshooting

1. **Cannot connect from other devices**

   - Check firewall settings: `sudo ufw status`
   - Allow necessary ports: `sudo ufw allow 5000/tcp`
   - Verify the server is listening on all interfaces (0.0.0.0), not just localhost
   - Try accessing the server using its IP address directly
   - Check if your network allows device-to-device communication

2. **Server crashes or won't start**

   - Check logs: `pm2 logs`
   - Verify MongoDB is running: `sudo systemctl status mongod`

3. **Database connection issues**

   - Check the MongoDB connection string in `server/.env`
   - Ensure the MongoDB service is running

4. **Permission issues**

   - Ensure the application has proper filesystem permissions

5. **Loading stuck or blank screen**
   - Open browser developer tools (F12) and check for errors in the Console tab
   - Make sure your firewall isn't blocking the connection
   - Try a different browser or device
   - If using a proxy server, ensure it's configured correctly
