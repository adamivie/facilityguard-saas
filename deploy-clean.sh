#!/bin/bash
# Clean deployment script without Amplify dependencies

set -e

echo "🧹 Clean deployment for FacilityGuard (no Amplify)..."

# Navigate to project directory
cd ~/facilityguard-saas

# Update repository
git pull origin main

# Use clean package.json without Amplify dependencies
cp package-clean.json package.json

# Remove old dependencies
rm -rf node_modules package-lock.json

# Install only essential dependencies
echo "📦 Installing clean dependencies..."
npm install --production

# Build the application
echo "🔨 Building Next.js application..."
npm run build

# Create PM2 configuration
echo "📝 Creating PM2 configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'facilityguard',
    script: 'npm',
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# Stop existing PM2 processes
pm2 delete all || true

# Start application
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "✅ Clean deployment complete!"
echo "📊 Application status:"
pm2 status