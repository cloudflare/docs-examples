export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const ROUTES = {
  TAGS: '/tags',
  APPROVAL: '/approval-for-ai-tagging',
} as const;

export const AI_CONFIG = {
  MODEL: '@cf/llava-hf/llava-1.5-7b-hf',
  PROMPT: 'Give me 5 different single word description tags for the image. Return them as a comma separated list with only the tags, no other text.',
  MAX_TOKENS: 512,
} as const;

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  INTERNAL_SERVER_ERROR: 500,
} as const;
