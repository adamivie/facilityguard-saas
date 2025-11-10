# FacilityGuard SaaS Platform Demo

## 🚀 Multi-Tenant SaaS Transformation Complete!

This is a **live demo** of the FacilityGuard platform transformed into a **multi-tenant SaaS application** with enterprise features.

## 🎯 SaaS Features Implemented

### 🏢 Multi-Tenant Architecture
- **Organization-based tenant isolation**
- **User roles & permissions** (Owner, Admin, Member, Viewer)
- **Custom organization URLs** (`facilityguard.com/your-org`)
- **White-label branding options**

### 🔐 Enterprise Authentication
- **NextAuth.js v5** with multiple SSO providers
- **Google Workspace & Microsoft 365** integration
- **Auth0 enterprise SSO** support
- **Smart onboarding flow** for new organizations

### 💳 Subscription & Billing
- **Stripe integration** with automated billing
- **Tiered pricing plans**:
  - **Starter**: $29/month (5 facilities, 1K surveys)
  - **Professional**: $99/month (25 facilities, 10K surveys)
  - **Enterprise**: $299/month (unlimited)
- **Usage-based limits** and enforcement
- **Customer billing portal**

### 📊 Advanced Analytics
- **Multi-tenant dashboard** with organization isolation
- **Real-time usage analytics**
- **Facility performance tracking**
- **Custom reporting & data export**

### ⚡ Enterprise Features
- **Role-based access control (RBAC)**
- **Team collaboration tools**
- **API access for integrations**
- **Advanced security & compliance**

## 🌐 Demo Pages Created

1. **Landing Page** (`/`) - SaaS marketing site with pricing
2. **Dashboard** (`/dashboard`) - Multi-tenant admin interface
3. **Onboarding** (`/onboarding`) - Organization setup flow
4. **Authentication** - SSO integration ready

## 📁 SaaS Architecture Files

```
├── schema-saas.prisma          # Multi-tenant database schema
├── src/lib/
│   ├── auth.ts                 # NextAuth.js SSO configuration
│   ├── stripe.ts               # Billing & subscription management
│   ├── tenant.ts               # Multi-tenant utilities & RBAC
│   └── db.ts                   # Prisma client configuration
├── src/app/
│   ├── page.tsx                # SaaS landing page
│   ├── dashboard/page.tsx      # Multi-tenant dashboard
│   └── onboarding/page.tsx     # Organization setup
└── package-saas.json           # SaaS dependencies
```

## 🎬 Demo Instructions

### Option 1: View Static Demo
The **live static demo** is already deployed at:
**https://main.d3lgdhnr0ro4in.amplifyapp.com**

### Option 2: Run Locally (Full SaaS Features)
1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/facilityguard"
   
   # NextAuth.js
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Google OAuth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   
   # Microsoft OAuth
   MICROSOFT_CLIENT_ID="your-microsoft-client-id"
   MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"
   
   # Stripe
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_STARTER_PRICE_ID="price_..."
   STRIPE_PRO_PRICE_ID="price_..."
   STRIPE_ENTERPRISE_PRICE_ID="price_..."
   ```

3. **Set up database**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

## 🔄 Demo Workflow

1. **Landing Page** → View SaaS pricing & features
2. **Sign Up** → Create organization or join existing
3. **SSO Login** → Google/Microsoft authentication
4. **Dashboard** → Multi-tenant facility management
5. **Billing** → Subscription management & usage tracking

## 🏆 Business Impact

This SaaS transformation provides:

- **Recurring Revenue Model** with subscription billing
- **Scalable Multi-Tenancy** for unlimited customers
- **Enterprise Sales Ready** with SSO & compliance
- **Streamlined Customer Acquisition** with trial accounts
- **Automated Billing & Usage Enforcement**
- **White-Label Options** for enterprise deals

## 🚀 Next Steps for Production

1. **Deploy to AWS** using existing Terraform infrastructure
2. **Configure Stripe** with real payment processing
3. **Set up SSO providers** (Google Workspace, Microsoft 365)
4. **Enable custom domains** for white-label customers
5. **Implement monitoring** and analytics tracking

**Ready to transform your facility maintenance service into a scalable SaaS business!** 🎯