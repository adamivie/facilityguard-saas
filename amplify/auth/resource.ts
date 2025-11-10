import { defineAuth, secret } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    // External providers can be configured after deployment
    // externalProviders: {
    //   google: {
    //     clientId: secret('GOOGLE_CLIENT_ID'),
    //     clientSecret: secret('GOOGLE_CLIENT_SECRET'),
    //   },
    //   github: {
    //     clientId: secret('GITHUB_CLIENT_ID'),
    //     clientSecret: secret('GITHUB_CLIENT_SECRET'),
    //   },
    //   callbackUrls: [
    //     'http://localhost:3000/auth/callback/',
    //     'https://facilityguard.com/auth/callback/',
    //   ],
    //   logoutUrls: [
    //     'http://localhost:3000/',
    //     'https://facilityguard.com/',
    //   ],
    // },
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