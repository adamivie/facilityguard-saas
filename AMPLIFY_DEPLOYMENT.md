# FacilityGuard SaaS - Amplify Gen 2 Deployment

## Environment Variables Setup
Before deploying, you need to set up environment variables for production:

### Required Environment Variables:
```bash
# Database (PostgreSQL RDS from existing Terraform)
DATABASE_URL="postgresql://username:password@facilityguard-db.region.rds.amazonaws.com:5432/facilityguard"

# NextAuth.js
NEXTAUTH_SECRET="your-production-secret-key"
NEXTAUTH_URL="https://your-app.amplifyapp.com"

# Google OAuth (for SSO)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Microsoft OAuth (for SSO)  
MICROSOFT_CLIENT_ID="your-microsoft-client-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"
MICROSOFT_TENANT_ID="your-tenant-id"

# Stripe (for billing)
STRIPE_SECRET_KEY="sk_live_your_stripe_secret_key"
STRIPE_STARTER_PRICE_ID="price_starter_plan_id"
STRIPE_PRO_PRICE_ID="price_pro_plan_id" 
STRIPE_ENTERPRISE_PRICE_ID="price_enterprise_plan_id"
```

## Deployment Commands:

1. **Deploy Backend (Database, Auth, Storage)**:
   ```bash
   npx ampx sandbox deploy
   ```

2. **Deploy Frontend (Next.js App)**:
   ```bash
   npm run build
   npx ampx pipeline deploy --branch main
   ```

3. **Monitor Deployment**:
   ```bash
   npx ampx sandbox list
   npx ampx pipeline status
   ```

## Post-Deployment Setup:

1. **Configure Custom Domain** (Optional):
   - Go to Amplify Console
   - Add your custom domain
   - Update NEXTAUTH_URL

2. **Set up Stripe Webhooks**:
   - Point to: `https://your-app.amplifyapp.com/api/webhooks/stripe`
   - Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

3. **Configure SSO Providers**:
   - Update Google OAuth redirect URIs
   - Update Microsoft app registration
   - Test authentication flows

## Architecture:
- **Frontend**: Next.js on AWS Amplify
- **Backend**: Amplify Gen 2 (GraphQL API, Auth)
- **Database**: PostgreSQL RDS (from existing Terraform)
- **Storage**: S3 (for QR codes, logos, files)
- **CDN**: CloudFront (automatic)
- **SSL**: Automatic certificate management