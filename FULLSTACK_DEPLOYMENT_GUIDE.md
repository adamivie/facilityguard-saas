# FacilityGuard - Full-Stack Amplify Gen 2 Deployment Guide

## 🚀 Deployment Status
The backend infrastructure has been configured with Amplify Gen 2 and committed to the repository. We're ready for full-stack deployment!

## 📋 What We've Built

### ✅ Backend Infrastructure (Amplify Gen 2)
- **Authentication**: Cognito with Google & GitHub OAuth
- **Database**: DynamoDB with multi-tenant schema
- **Storage**: S3 with organized access patterns  
- **API**: GraphQL with AppSync for real-time data

### ✅ Multi-Tenant Schema
- `Organization` - Root tenant entity
- `Facility` - Buildings/locations per organization
- `Survey` - Feedback forms and QR code generators
- `Response` - Patron feedback and analytics
- `Analytics` - Dashboard metrics and reporting

## 🔧 Next Steps: Deploy via AWS Amplify Console

Since we've encountered credential complexity with local CDK deployment, the most reliable approach is to use the AWS Amplify Console for full-stack deployment:

### 1. Create New Amplify App (AWS Console)
1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click "Create new app" → "Host web app"
3. Choose "GitHub" as source
4. Connect to repository: `adamivie/facilityguard-saas`
5. Select branch: `main`
6. **Important**: Choose "Web Compute" (not Web Static) for full-stack deployment

### 2. Configure Build Settings
The `amplify.yml` is already configured for Amplify Gen 2 deployment:
```yaml
version: 1
backend:
  phases:
    build:
      commands:
        - echo "Building Amplify Gen 2 backend..."
        - npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID
frontend:
  phases:
    preBuild:
      commands:
        - npm ci --legacy-peer-deps
        - npx ampx generate outputs --branch $AWS_BRANCH --app-id $AWS_APP_ID
    build:
      commands:
        - echo "Building full-stack Next.js application..."
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
```

### 3. Environment Variables (Console)
Add these in Amplify Console → App Settings → Environment Variables:
```
# OAuth Configuration (Required)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret  
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Application Settings
APP_NAME=FacilityGuard
APP_URL=https://your-amplify-domain.amplifyapp.com

# Amplify will auto-generate these:
# - AMPLIFY_* variables
# - Database connection strings
# - API endpoints
```

### 4. OAuth Provider Setup

#### Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create/select project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID
4. Add authorized redirect URIs:
   - `https://your-amplify-domain.auth.us-west-2.amazoncognito.com/oauth2/idpresponse`

#### GitHub OAuth:
1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Create new OAuth App
3. Add Authorization callback URL:
   - `https://your-amplify-domain.auth.us-west-2.amazoncognito.com/oauth2/idpresponse`

## 🎯 Expected Deployment Results

### ✅ Infrastructure Created:
- **Cognito User Pool**: User authentication and management
- **DynamoDB Tables**: Multi-tenant data storage
- **S3 Buckets**: File storage with organized access
- **AppSync API**: GraphQL endpoint for frontend
- **CloudFront Distribution**: Global content delivery
- **Lambda Functions**: API resolvers and triggers

### ✅ Application Features:
- **Multi-tenant SaaS**: Organization isolation
- **Social Authentication**: Google + GitHub login
- **Facility Management**: QR code generation
- **Survey System**: Patron feedback collection
- **Real-time Analytics**: Dashboard metrics
- **Responsive Design**: Mobile-first UI

### ✅ Production URLs:
- **Frontend**: `https://[app-id].amplifyapp.com`
- **GraphQL API**: Auto-generated endpoint
- **Auth**: Cognito-hosted UI available
- **Storage**: S3 bucket with CDN

## 🔍 Monitoring Deployment

After creating the Amplify app:
1. Monitor the build logs in real-time
2. Backend deployment will take 5-10 minutes (CDK stack creation)
3. Frontend build will complete quickly after backend
4. Test authentication and database functionality

## 🛠️ Local Development Setup

Once deployed, set up local development:
```bash
# Download the amplify_outputs.json from the deployed app
npx ampx generate outputs --app-id YOUR_APP_ID --branch main

# Start local development
npm run dev
```

## 🚨 Troubleshooting

### Common Issues:
1. **CDK Bootstrap**: Amplify handles this automatically in Console deployment
2. **Permissions**: Web Compute platform includes all necessary IAM roles  
3. **OAuth Setup**: Must configure redirect URIs after getting Amplify domain
4. **Environment Variables**: Add OAuth secrets in Console after provider setup

---

## 📊 Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React/Next.js │───▶│   AWS Amplify    │───▶│   Multi-Tenant  │
│   Frontend      │    │   (Gen 2)        │    │   Backend       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │                          │
                              ▼                          ▼
                    ┌──────────────────┐    ┌─────────────────┐
                    │   Authentication │    │   Data Layer    │
                    │   (Cognito)      │    │   (DynamoDB)    │
                    └──────────────────┘    └─────────────────┘
```

The application is now ready for full-stack deployment! 🎉