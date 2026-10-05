import { z } from 'zod';

export const ImplementationPlanSchema = z.object({
  summary: z.string(),

  filesToModify: z.array(
    z.object({
      path: z.string(),
      reason: z.string(),
    }),
  ),

  filesToCreate: z.array(
    z.object({
      path: z.string(),
      reason: z.string(),
    }),
  ),

  steps: z.array(
    z.object({
      order: z.number(),
      description: z.string(),
    }),
  ),

  testingStrategy: z.array(z.string()),

  risks: z.array(z.string()),
});

export type ImplementationPlan =
  z.infer<typeof ImplementationPlanSchema>;