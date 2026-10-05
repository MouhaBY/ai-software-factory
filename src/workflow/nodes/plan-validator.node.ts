import {
    Injectable,
} from '@nestjs/common';

import {
    WorkflowStateType,
} from '../workflow.state.js';

@Injectable()
export class PlanValidatorNode {
    async execute(
        state: WorkflowStateType,
    ): Promise<
        Partial<WorkflowStateType>
    > {
        if (!state.plan) {
            throw new Error(
                'Implementation plan is missing',
            );
        }

        if (!state.researchResult) {
            throw new Error(
                'Repository research is missing',
            );
        }

        const knownFiles =
            new Set(
                state.researchResult.relevantFiles.map(
                    (file) => file.path,
                ),
            );

        for (
            const file
            of state.plan.filesToModify
        ) {
            if (
                !knownFiles.has(file.path)
            ) {
                throw new Error(
                    `[PLAN_VALIDATOR] Architect proposed unknown file: ${file.path}`,
                );
            }
        }

        console.log(
            '[PLAN_VALIDATOR] Plan validated',
        );

        return {};
    }
}
