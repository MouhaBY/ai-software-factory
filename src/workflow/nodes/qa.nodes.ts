import { Injectable } from '@nestjs/common';

import {
  QaService,
} from '../../agents/qa/qa.service.js';

import {
  WorkflowStateType,
} from '../workflow.state.js';

@Injectable()
export class QaNode {
  constructor(
    private readonly qaService:
      QaService,
  ) {}

  async execute(
    state: WorkflowStateType,
  ): Promise<Partial<WorkflowStateType>> {
    if (!state.changes) {
      throw new Error(
        'Coding must run before QA',
      );
    }

    console.log('[QA] Running validation...');

    const qaResult =
      await this.qaService.run();

    console.log(
      `[QA] result: ${
        qaResult.passed ? 'PASS' : 'FAIL'
      }`,
    );

    return {
      qaResult,
    };
  }
}
