import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      },
      callbackUrls: [
        'http://localhost:3000/auth/callback/',
        'https://facilityguard.com/auth/callback/',
      ],
      logoutUrls: [
        'http://localhost:3000/',
        'https://facilityguard.com/',
      ],
    },
  },
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
    givenName: {
      required: true,
      mutable: true,
    },
    familyName: {
      required: true,  
      mutable: true,
    },
    'custom:organization_id': {
      dataType: 'String',
      mutable: true,
    },
    'custom:role': {
      dataType: 'String', 
      mutable: true,
    },
  },
});