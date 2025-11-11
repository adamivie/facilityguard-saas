#!/bin/bash
# EC2 Deployment Script for FacilityGuard with HTTPS
# Run this script on your EC2 instance after setup

set -e

echo "🚀 Starting FacilityGuard deployment with HTTPS..."

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

# Install Nginx and Certbot for SSL
echo "📦 Installing Nginx and Certbot..."
sudo apt install nginx certbot python3-certbot-nginx -y

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

# Get the public IP for SSL certificate
echo "🔍 Getting public IP address..."
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com/)
echo "Public IP: $PUBLIC_IP"

# Configure Nginx with HTTPS redirect
echo "🌐 Configuring Nginx with HTTPS..."
sudo tee /etc/nginx/sites-available/facilityguard << EOL
# HTTP server - redirects to HTTPS
server {
    listen 80;
    server_name $PUBLIC_IP _;
    
    # Redirect all HTTP traffic to HTTPS
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name $PUBLIC_IP _;

    # SSL configuration will be added by certbot
    
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

# Generate self-signed certificate for immediate HTTPS (temporary)
echo "🔐 Generating temporary self-signed SSL certificate..."
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/facilityguard.key \
    -out /etc/nginx/ssl/facilityguard.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=$PUBLIC_IP"

# Update Nginx config to use the SSL certificate
sudo tee /etc/nginx/sites-available/facilityguard << EOL
# HTTP server - redirects to HTTPS
server {
    listen 80;
    server_name $PUBLIC_IP _;
    
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name $PUBLIC_IP _;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/facilityguard.crt;
    ssl_certificate_key /etc/nginx/ssl/facilityguard.key;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
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

sudo nginx -t
sudo systemctl reload nginx

echo "✅ Deployment complete with HTTPS!"
echo "🌐 Your application is accessible at:"
echo "   🔓 HTTP:  http://$PUBLIC_IP (redirects to HTTPS)"
echo "   🔒 HTTPS: https://$PUBLIC_IP"
echo ""
echo "⚠️  Note: Using self-signed certificate (browser will show warning)"
echo "📊 Use 'pm2 status' to check application status"
echo "📊 Use 'pm2 logs' to view application logs"
echo ""
echo "🔐 To get a trusted SSL certificate later:"
echo "   sudo certbot --nginx -d $PUBLIC_IP"