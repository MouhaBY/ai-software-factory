import {
    Injectable,
} from '@nestjs/common';

import {
    WorkflowStateType,
} from '../workflow.state.js';

@Injectable()
export class ImplementationGateNode {
    async execute(
        state: WorkflowStateType,
    ): Promise<
        Partial<WorkflowStateType>
    > {
        if (
            !state.codingWriteCount ||
            state.codingWriteCount === 0
        ) {
            throw new Error(
                '[IMPLEMENTATION_GATE] Coding finished without modifying any file',
            );
        }

        console.log(
            `[IMPLEMENTATION_GATE] ${state.codingWriteCount
            } write operation(s) detected`,
        );

        return {};
    }
}