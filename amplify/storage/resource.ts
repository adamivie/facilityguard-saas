import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'facilityguardStorage',
  access: (allow) => ({
    'organization-assets/{organization_id}/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
      allow.guest.to(['read']),
    ],
    'qr-codes/{organization_id}/*': [
      allow.authenticated.to(['read', 'write']),
      allow.guest.to(['read']),
    ],
    'reports/{organization_id}/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
    'public/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read', 'write']),
    ],
  }),
});