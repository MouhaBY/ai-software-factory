import {z} from 'zod';

export const AnalysisSchema = z.object({
    type: z.enum([
        'bug',
        'feature',
        'refactor',
        'security',
        'documentation',
    ]),

    summary: z.string(),
    requirements: z.array(z.string()),
    acceptanceCriteria: z.array(z.string()),
    securitySensitive: z.boolean(),
    requiresResearch: z.boolean(),

});

export type AnalysisResult = z.infer<typeof AnalysisSchema>;
