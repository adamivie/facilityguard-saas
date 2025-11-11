# EC2 Deployment PowerShell Script
# This script launches an EC2 instance and deploys FacilityGuard

param(
    [string]$KeyPairName = "facilityguard-key",
    [string]$InstanceType = "t3.micro",
    [string]$Region = "us-west-2"
)

Write-Host "Starting EC2 deployment for FacilityGuard..." -ForegroundColor Green

# Create key pair
Write-Host "Creating EC2 key pair..." -ForegroundColor Cyan
try {
    $keyMaterial = aws ec2 create-key-pair --key-name $KeyPairName --query 'KeyMaterial' --output text --region $Region
    $keyMaterial | Out-File -FilePath "$KeyPairName.pem" -Encoding ASCII
    Write-Host "Key pair created: $KeyPairName.pem" -ForegroundColor Green
} catch {
    Write-Host "Key pair might already exist, continuing..." -ForegroundColor Yellow
}

# Get latest Ubuntu AMI
Write-Host "Finding latest Ubuntu 22.04 LTS AMI..." -ForegroundColor Cyan
$amiId = aws ec2 describe-images --owners 099720109477 --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" --query 'Images[0].ImageId' --output text --region $Region

Write-Host "Using AMI: $amiId" -ForegroundColor Cyan

# Create security group
Write-Host "Creating security group..." -ForegroundColor Cyan
$sgId = aws ec2 create-security-group --group-name facilityguard-sg --description "Security group for FacilityGuard" --query 'GroupId' --output text --region $Region

# Add security group rules
aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 22 --cidr 0.0.0.0/0 --region $Region
aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $Region
aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 443 --cidr 0.0.0.0/0 --region $Region

Write-Host "Security group created: $sgId" -ForegroundColor Green

# Create user data script
$userData = @"
#!/bin/bash
apt update
apt install -y git
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install pm2 -g
apt install nginx -y
cd /home/ubuntu
git clone https://github.com/adamivie/facilityguard-saas.git
chown -R ubuntu:ubuntu facilityguard-saas
"@

$userDataBase64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($userData))

# Launch EC2 instance
Write-Host "Launching EC2 instance..." -ForegroundColor Cyan
$instanceId = aws ec2 run-instances --image-id $amiId --count 1 --instance-type $InstanceType --key-name $KeyPairName --security-group-ids $sgId --user-data $userDataBase64 --query 'Instances[0].InstanceId' --output text --region $Region

Write-Host "Instance launched: $instanceId" -ForegroundColor Green

# Wait for instance to be running
Write-Host "Waiting for instance to be running..." -ForegroundColor Cyan
aws ec2 wait instance-running --instance-ids $instanceId --region $Region

# Get public IP
$publicIp = aws ec2 describe-instances --instance-ids $instanceId --query 'Reservations[0].Instances[0].PublicIpAddress' --output text --region $Region

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "EC2 Instance Ready!" -ForegroundColor Green
Write-Host "Instance ID: $instanceId" -ForegroundColor Cyan
Write-Host "Public IP: $publicIp" -ForegroundColor Cyan
Write-Host "Key File: $KeyPairName.pem" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Wait 2-3 minutes for initial setup to complete" -ForegroundColor White
Write-Host "2. SSH to your instance:" -ForegroundColor White
Write-Host "   ssh -i $KeyPairName.pem ubuntu@$publicIp" -ForegroundColor Gray
Write-Host "3. Run the deployment script:" -ForegroundColor White
Write-Host "   cd facilityguard-saas" -ForegroundColor Gray
Write-Host "   chmod +x deploy-ec2.sh" -ForegroundColor Gray  
Write-Host "   ./deploy-ec2.sh" -ForegroundColor Gray
Write-Host "4. Access your app at: http://$publicIp" -ForegroundColor White
Write-Host ""