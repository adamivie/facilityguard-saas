import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';

export const backend = defineBackend({
  auth,
  data,
  storage,
});

// Add environment-specific configuration
const { cfnUserPool } = backend.auth.resources.cfnResources;
if (cfnUserPool) {
  cfnUserPool.userPoolName = `facilityguard-saas-${backend.auth.resources.userPool.userPoolId}`;
}