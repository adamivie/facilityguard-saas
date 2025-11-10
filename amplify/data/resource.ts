import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // Organization (Multi-tenant root entity)
  Organization: a
    .model({
      id: a.id().required(),
      name: a.string().required(),
      slug: a.string().required(),
      subscription_tier: a.enum(['starter', 'professional', 'enterprise']),
      subscription_status: a.enum(['active', 'cancelled', 'past_due']),
      created_at: a.datetime(),
      updated_at: a.datetime(),
      
      // Relations
      facilities: a.hasMany('Facility', 'organization_id'),
      users: a.hasMany('UserOrganization', 'organization_id'),
      surveys: a.hasMany('Survey', 'organization_id'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.groups(['admins']),
      allow.authenticated().to(['read']),
    ]),

  // User-Organization junction (for multi-tenant user access)
  UserOrganization: a
    .model({
      id: a.id().required(),
      user_id: a.string().required(),
      organization_id: a.id().required(),
      role: a.enum(['owner', 'admin', 'manager', 'viewer']),
      created_at: a.datetime(),
      
      // Relations
      organization: a.belongsTo('Organization', 'organization_id'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.groups(['admins']),
    ]),

  // Facility (Buildings/locations within an organization)
  Facility: a
    .model({
      id: a.id().required(),
      organization_id: a.id().required(),
      name: a.string().required(),
      address: a.string(),
      facility_type: a.enum(['office', 'retail', 'restaurant', 'hotel', 'healthcare', 'other']),
      qr_code_url: a.string(),
      is_active: a.boolean().default(true),
      created_at: a.datetime(),
      updated_at: a.datetime(),
      
      // Relations
      organization: a.belongsTo('Organization', 'organization_id'),
      surveys: a.hasMany('Survey', 'facility_id'),
      responses: a.hasMany('Response', 'facility_id'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.groups(['admins']),
      allow.authenticated().to(['read']),
    ]),

  // Survey templates
  Survey: a
    .model({
      id: a.id().required(),
      organization_id: a.id().required(),
      facility_id: a.id(),
      title: a.string().required(),
      description: a.string(),
      questions: a.json(), // Array of question objects
      is_active: a.boolean().default(true),
      created_at: a.datetime(),
      updated_at: a.datetime(),
      
      // Relations
      organization: a.belongsTo('Organization', 'organization_id'),
      facility: a.belongsTo('Facility', 'facility_id'),
      responses: a.hasMany('Response', 'survey_id'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.groups(['admins']),
      allow.authenticated().to(['read']),
    ]),

  // Survey responses from patrons
  Response: a
    .model({
      id: a.id().required(),
      survey_id: a.id().required(),
      facility_id: a.id().required(),
      respondent_email: a.string(),
      answers: a.json(), // Array of answer objects
      overall_rating: a.float(),
      feedback: a.string(),
      ip_address: a.string(),
      user_agent: a.string(),
      submitted_at: a.datetime(),
      
      // Relations
      survey: a.belongsTo('Survey', 'survey_id'),
      facility: a.belongsTo('Facility', 'facility_id'),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(['create']), // Allow public survey submissions
      allow.owner(),
      allow.groups(['admins']),
      allow.authenticated().to(['read']),
    ]),

  // Analytics aggregations (for dashboard)
  Analytics: a
    .model({
      id: a.id().required(),
      organization_id: a.id().required(),
      facility_id: a.id(),
      metric_type: a.enum(['daily_responses', 'weekly_summary', 'monthly_summary']),
      metric_date: a.date(),
      total_responses: a.integer(),
      average_rating: a.float(),
      satisfaction_score: a.float(),
      data: a.json(), // Additional metric data
      created_at: a.datetime(),
      
      // Relations
      organization: a.belongsTo('Organization', 'organization_id'),
      facility: a.belongsTo('Facility', 'facility_id'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.groups(['admins']),
      allow.authenticated().to(['read']),
    ]),
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