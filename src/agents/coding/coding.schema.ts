import z from "zod";

export const CodingResultSchema = z.object({
    completed: z.boolean(),

    summary: z.array(z.string()),

    createdFiles: z.array(z.string()),

    remainingWork: z.array(z.string()),

    warnings: z.array(z.string()),
});

export type CodingResult = z.infer<typeof CodingResultSchema>;
