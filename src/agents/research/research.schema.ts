import { z } from 'zod';

export const ResearchResultSchema =
    z.object({
        summary: z.string(),

        relevantFiles: z.array(
            z.object({
                path: z.string(),
                reason: z.string(),
            }),
        ),

        conventions: z.array(z.string()),

        dependencies: z.array(z.string()),

        findings: z.array(z.string()),
    });

export type ResearchResult =
    z.infer<
        typeof ResearchResultSchema
    >;