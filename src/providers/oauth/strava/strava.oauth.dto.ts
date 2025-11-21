import { z } from 'zod';

export const StravaTokenResponseSchema = z.object({
  token_type: z.string(),
  access_token: z.string(),
  expires_at: z.number(), // epoch seconds
  expires_in: z.number(),
  refresh_token: z.string(),
  athlete: z.object({
    id: z.number(),
    username: z.string().nullable().optional(),
    firstname: z.string().nullable().optional(),
    lastname: z.string().nullable().optional(),
    email: z.string().email().nullable().optional(),
  }),
});
export type StravaTokenResponse = z.infer<typeof StravaTokenResponseSchema>;
