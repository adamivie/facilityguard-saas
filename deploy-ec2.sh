#!/bin/bash
# EC2 Deployment Script for FacilityGuard
# Run this script on your EC2 instance after setup

set -e

echo "🚀 Starting FacilityGuard deployment..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install pm2 -g

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt install nginx -y

# Clone repository (you'll need to update this URL)
echo "📦 Cloning repository..."
cd /home/ubuntu
git clone https://github.com/adamivie/facilityguard-saas.git
cd facilityguard-saas

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Build the application
echo "🔨 Building Next.js application..."
npm run build

# Create PM2 ecosystem file
echo "📝 Creating PM2 configuration..."
cat > ecosystem.config.js << EOL
module.exports = {
  apps: [{
    name: 'facilityguard',
    script: 'npm',
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOL

# Start application with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Configure Nginx
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/facilityguard << EOL
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

# Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/facilityguard /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "✅ Deployment complete!"
echo "🌐 Your application should be accessible at http://YOUR_EC2_PUBLIC_IP"
echo "📊 Use 'pm2 status' to check application status"
echo "📊 Use 'pm2 logs' to view application logs"