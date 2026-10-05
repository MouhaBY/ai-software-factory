import { Injectable } from '@nestjs/common';

import {
    HumanMessage,
    SystemMessage,
} from '@langchain/core/messages';

import { LlmService } from '../../llm/llm.service.js';

import {
    AnalysisResult,
} from '../analyst/analyst.schema.js';

import {
    ImplementationPlan,
    ImplementationPlanSchema,
} from './architect.schema.js';
import { ResearchResult } from '../research/research.schema.js';

@Injectable()
export class ArchitectAgent {
    constructor(
        private readonly llmService: LlmService,
    ) { }

    async createPlan(
        ticket: string,
        analysis: AnalysisResult,
        researchResult: ResearchResult,
    ): Promise<ImplementationPlan> {
        const model =
            this.llmService.model.withStructuredOutput(
                ImplementationPlanSchema,
            );

        return this.llmService.invokeWithRetry(() => model.invoke([
            new SystemMessage(`
                You are a senior software architect.

                Your job is to create a concrete implementation plan
                for a software engineering task.

                Rules:
                - Base the plan only on provided information.
                - Never invent repository files.
                - If repository research is available, use it.
                - Prefer existing project conventions.
                - Keep changes minimal and focused.
                - Clearly distinguish files to modify from files to create.
                - Include a testing strategy.
                - Identify relevant technical risks.
                - Do not implement code.
            `),

            new HumanMessage(`
                SOFTWARE TICKET:

                ${ticket}

                ANALYSIS:

                ${JSON.stringify(analysis, null, 2)}

                VERIFIED REPOSITORY RESEARCH:

                ${JSON.stringify(
                    researchResult,
                    null,
                    2,
                )}

                Create the implementation plan.
            `),
        ]));
    }
}