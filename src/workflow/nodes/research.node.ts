import { Injectable } from '@nestjs/common';

import {
  ResearchGraph,
} from '../../agents/research/research.graph.js';

import {
  WorkflowStateType,
} from '../workflow.state.js';

@Injectable()
export class ResearchNode {
  constructor(
    private readonly researchGraph:
      ResearchGraph,
  ) {}

  async execute(
    state: WorkflowStateType,
  ): Promise<Partial<WorkflowStateType>> {
    const researchResult =
      await this.researchGraph.research(
        state.ticket,
      );

    return {
      researchResult,
    };
  }
}