import { Injectable } from "@nestjs/common";
import { LlmService } from "../../llm/llm.service.js";
import { AnalysisResult, AnalysisSchema } from "./analyst.schema.js";

@Injectable()
export class AnalystAgent {
    constructor(
        private readonly llmService: LlmService,
    ) { }

    async analyze(ticket: string): Promise<AnalysisResult> {
        const structuredModel = this.llmService.model.withStructuredOutput(AnalysisSchema);

        return this.llmService.invokeWithRateLimit(() => structuredModel.invoke([
            {
                role: 'system',
                content: `
                    You are a senior software engineering analyst.

                    Your job is to analyze software engineering tickets.

                    Rules:
                    - Do not invent repository facts.
                    - Identify the task type.
                    - Extract explicit requirements.
                    - Produce concrete acceptance criteria.
                    - Determine whether the task is security sensitive.
                    - Determine whether repository or documentation research is required.
                    - If information is missing, do not invent it.
                `,
            },
            {
                role: 'user',
                content: ticket,
            },
        ]));
    }

}
