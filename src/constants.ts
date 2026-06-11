// Haiku 4.5 — the cheapest, fastest model in the family. Turning a short flow
// description into Mermaid is well-scoped, so a frontier model would be wasted here.
export const MODEL = 'claude-haiku-4-5';

// Mermaid for a single flow rarely runs past a few hundred tokens. A tight ceiling
// keeps cost bounded and trims latency.
export const MAX_TOKENS = 1500;

export const EXAMPLE_PROMPTS = [
  'OAuth login with refresh tokens',
  'CI/CD pipeline from commit to production',
  'User checkout flow with payment retry',
  'Request through an API gateway to microservices',
] as const;
