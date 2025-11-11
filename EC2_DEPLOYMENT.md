# FacilityGuard EC2 Deployment Guide

## Quick Deployment

### Prerequisites
- AWS CLI configured with root/admin credentials
- This repository pushed to GitHub

### 1. Launch EC2 Instance
```powershell
.\launch-ec2.ps1
```

This will:
- Create EC2 key pair
- Launch Ubuntu 22.04 instance
- Configure security groups (SSH, HTTP, HTTPS)
- Install basic dependencies

### 2. Deploy Application
SSH to your instance and run:
```bash
cd facilityguard-saas
chmod +x deploy-ec2.sh
./deploy-ec2.sh
```

This will:
- Install Node.js 20, PM2, Nginx
- Build and start your Next.js app
- Configure reverse proxy
- Set up auto-restart

### 3. Access Your Application
Visit: `http://YOUR_EC2_PUBLIC_IP`

## Manual Steps (Alternative)

### Launch Instance Manually
```bash
# Create key pair
aws ec2 create-key-pair --key-name facilityguard-key --query 'KeyMaterial' --output text > facilityguard-key.pem

# Launch instance
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --count 1 \
  --instance-type t3.micro \
  --key-name facilityguard-key \
  --security-groups default
```

### SSH and Deploy
```bash
ssh -i facilityguard-key.pem ubuntu@YOUR_PUBLIC_IP

# Install dependencies
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx
sudo npm install pm2 -g

# Clone and build
git clone https://github.com/adamivie/facilityguard-saas.git
cd facilityguard-saas
npm install
npm run build

# Start with PM2
pm2 start npm --name "facilityguard" -- start
pm2 save
pm2 startup
```

## Configuration Files

### Nginx Configuration (`/etc/nginx/sites-available/facilityguard`)
```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### PM2 Ecosystem (`ecosystem.config.js`)
```javascript
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
```

## Management Commands

```bash
# Check application status
pm2 status

# View logs
pm2 logs

# Restart application
pm2 restart facilityguard

# Check Nginx status
sudo systemctl status nginx

# Test Nginx configuration
sudo nginx -t
```

## Costs
- t3.micro: ~$8-12/month
- Additional costs: EBS storage, data transfer

## Security Notes
- Change default security group rules
- Set up proper SSL certificates
- Configure firewall rules
- Regular security updates