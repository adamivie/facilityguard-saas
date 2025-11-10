import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        scopes: ['email', 'profile', 'openid']
      },
      oidc: [
        {
          name: 'Microsoft',
          clientId: process.env.MICROSOFT_CLIENT_ID || '',
          clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
          issuerUrl: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/v2.0`,
          scopes: ['email', 'profile', 'openid']
        }
      ],
      callbackUrls: [
        'http://localhost:3000/api/auth/callback',
        'https://main.d3lgdhnr0ro4in.amplifyapp.com/api/auth/callback'
      ],
      logoutUrls: [
        'http://localhost:3000/',
        'https://main.d3lgdhnr0ro4in.amplifyapp.com/'
      ]
    }
  },
  userAttributes: {
    email: {
      required: true,
      mutable: true
    },
    name: {
      required: false,
      mutable: true
    },
    'custom:organizationId': {
      dataType: 'String',
      mutable: true
    },
    'custom:role': {
      dataType: 'String',  
      mutable: true
    }
  }
});