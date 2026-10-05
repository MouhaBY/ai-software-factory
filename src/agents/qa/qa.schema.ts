import { z } from 'zod';

export const CheckResultSchema = z.object({
  status: z.enum([
    'passed',
    'failed',
    'no_tests',
    'error',
  ]),

  stdout: z.string(),
  stderr: z.string(),
  exitCode: z.number(),
});

export const QaResultSchema = z.object({
  passed: z.boolean(),

  tests: CheckResultSchema,
  build: CheckResultSchema,
  typecheck: CheckResultSchema,

  failures: z.array(z.string()),
});

export type CheckResult =
  z.infer<typeof CheckResultSchema>;

export type QaResult =
  z.infer<typeof QaResultSchema>;