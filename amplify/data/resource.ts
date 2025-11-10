import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Organization: a
    .model({
      name: a.string().required(),
      slug: a.string().required(),
      domain: a.string(),
      plan: a.enum(['TRIAL', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
      status: a.enum(['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED']),
      trialEndsAt: a.datetime(),
      stripeCustomerId: a.string(),
      stripeSubscriptionId: a.string(),
      billingEmail: a.string(),
      logo: a.string(),
      primaryColor: a.string(),
      facilities: a.hasMany('Facility', 'organizationId'),
      users: a.hasMany('User', 'organizationId'),
      surveys: a.hasMany('Survey', 'organizationId'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.groups(['admins'])
    ]),

  User: a
    .model({
      email: a.string().required(),
      name: a.string(),
      role: a.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']),
      organizationId: a.id().required(),
      provider: a.string(),
      providerId: a.string(),
      organization: a.belongsTo('Organization', 'organizationId'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.groups(['admins'])
    ]),

  Facility: a
    .model({
      name: a.string().required(),
      location: a.string(),
      type: a.enum(['RESTROOM', 'KITCHEN', 'LOBBY', 'OFFICE', 'OUTDOOR', 'OTHER']),
      organizationId: a.id().required(),
      qrCodeUrl: a.string(),
      isActive: a.boolean().default(true),
      organization: a.belongsTo('Organization', 'organizationId'),
      surveys: a.hasMany('Survey', 'facilityId'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.groups(['admins'])
    ]),

  Survey: a
    .model({
      facilityId: a.id().required(),
      organizationId: a.id().required(),
      cleanlinessRating: a.integer().required(),
      suppliesRating: a.integer().required(),
      overallRating: a.integer(),
      hasIssues: a.boolean().default(false),
      issueDescription: a.string(),
      issueType: a.enum(['CLEANLINESS', 'SUPPLIES', 'MAINTENANCE', 'SAFETY', 'OTHER']),
      urgency: a.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
      ipAddress: a.string(),
      userAgent: a.string(),
      facility: a.belongsTo('Facility', 'facilityId'),
      organization: a.belongsTo('Organization', 'organizationId'),
    })
    .authorization((allow) => [
      allow.guest().to(['create', 'read']), // Allow anonymous survey submissions
      allow.owner(),
      allow.groups(['admins'])
    ])
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});