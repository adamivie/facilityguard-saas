#!/bin/bash
# Setup HTTPS for existing FacilityGuard deployment

set -e

echo "🔒 Setting up HTTPS for FacilityGuard..."

# Get the public IP
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com/)
echo "Public IP: $PUBLIC_IP"

# Install certbot if not installed
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Generate self-signed certificate
echo "🔐 Generating self-signed SSL certificate..."
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/facilityguard.key \
    -out /etc/nginx/ssl/facilityguard.crt \
    -subj "/C=US/ST=State/L=City/O=FacilityGuard/CN=$PUBLIC_IP"

# Update Nginx configuration for HTTPS
echo "🌐 Configuring Nginx for HTTPS..."
sudo tee /etc/nginx/sites-available/facilityguard << 'EOF'
# HTTP server - redirects to HTTPS
server {
    listen 80;
    server_name _;
    
    return 301 https://$host$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name _;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/facilityguard.crt;
    ssl_certificate_key /etc/nginx/ssl/facilityguard.key;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Additional security
        proxy_hide_header X-Powered-By;
    }
}
EOF

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx

# Open firewall for HTTPS if ufw is active
if sudo ufw status | grep -q "Status: active"; then
    sudo ufw allow 443/tcp
    echo "✅ Opened port 443 in firewall"
fi

echo ""
echo "✅ HTTPS setup complete!"
echo "🌐 Your application is now accessible at:"
echo "   🔓 HTTP:  http://$PUBLIC_IP (redirects to HTTPS)"
echo "   🔒 HTTPS: https://$PUBLIC_IP"
echo ""
echo "⚠️  Note: Using self-signed certificate (browser will show security warning)"
echo "   Click 'Advanced' and 'Proceed to $PUBLIC_IP' to access your app"
echo ""
echo "🔐 To get a trusted certificate from Let's Encrypt (requires domain name):"
echo "   sudo certbot --nginx -d yourdomain.com"