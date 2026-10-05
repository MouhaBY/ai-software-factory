import { Module } from '@nestjs/common';
import { AgentsModule } from '../agents/agents.module.js';
import { WorkflowService } from './workflow.service.js';
import { AnalystNode } from './nodes/analyst.node.js';
import { WorkflowController } from './workflow.controller.js';
import { ResearchNode } from './nodes/research.node.js';
import { ArchitectNode } from './nodes/architect.node.js';
import { CodingNode } from './nodes/coding.node.js';
import { QaNode } from './nodes/qa.nodes.js';
import { PlanValidatorNode } from './nodes/plan-validator.node.js';

@Module({
    imports: [
        AgentsModule,
    ],
    controllers: [WorkflowController],
    providers: [
        AnalystNode,
        ResearchNode,
        ArchitectNode,
        WorkflowService,
        CodingNode,
        QaNode,
        PlanValidatorNode,
    ],
    exports: [
        WorkflowService,
    ],
})
export class WorkflowModule {}
