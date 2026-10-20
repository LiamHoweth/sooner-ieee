// Railway Infrastructure as Code for the IEEE Sooners API.
// Preview changes with `railway config plan`, apply with `railway config apply`
// (run both from server/). Variables stay in the Railway dashboard (unmanaged)
// so no secrets live in this file. See docs/BACKEND.md.
import { defineRailway, github, project, service, volume } from 'railway/iac';

// This repository manages only its own resources in the project.
export const partial = 'ieee-sooners-api';

export default defineRailway(() => {
  // Holds the SQLite database and uploaded images. Never remove it from this file:
  // that would detach (and risk deleting) every post, image and admin account.
  const data = volume('ieee-sooners-api-volume', { sizeMB: 5000, region: 'sfo' });

  const api = service('ieee-sooners-api', {
    source: github('LiamHoweth/sooner-ieee', { branch: 'main', rootDirectory: '/server' }),
    build: {
      builder: 'RAILPACK',
      buildEnvironment: 'V3',
      buildCommand: 'npm ci && npm run build',
      watchPatterns: ['/server/**'],
    },
    deploy: {
      restartPolicyType: 'ON_FAILURE',
      restartPolicyMaxRetries: 10,
      // Refuse to start without the volume rather than writing to throwaway disk.
      requiredMountPath: '/data',
    },
    start: 'npm run start',
    healthcheck: '/api/health',
    healthcheckTimeout: 60,
    // SQLite on one volume: exactly one replica.
    replicas: { sfo: 1 },
    volumeMounts: { '/data': data },
  });

  return project('IEEE Sooners', {
    variables: { managed: false },
    resources: [api, data],
  });
});
