export const env = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  AUTH_SECRET: process.env.AUTH_SECRET || 'development-secret-key',
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_MOCK: process.env.NEXT_PUBLIC_API_MOCKING === 'true',
} as const;
