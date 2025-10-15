import { z } from 'zod';

export const EnvSchema = z.object({
  STRAVA_CLIENT_ID: z.string().min(1),
  STRAVA_CLIENT_SECRET: z.string().min(1),
  STRAVA_REDIRECT_URI: z.string().url(),
  ACCES_TOKEN: z.string().min(1).optional(),
  REFRESH_TOKEN: z.string().min(1).optional(),
});

export type Env = z.infer<typeof EnvSchema>;
