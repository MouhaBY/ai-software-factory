import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module.js';
import { AnalystAgent } from './analyst/analyst.agent.js';
import { AnalystController } from './analyst/analyst.controller.js';
import { ToolsModule } from '../tools/tools.module.js';
import { ResearchGraph } from './research/research.graph.js';
import { ArchitectAgent } from './architect/architect.agent.js';
import { CodingGraph } from './coding/coding.graph.js';

@Module({
    imports: [LlmModule, ToolsModule],
    providers: [AnalystAgent, ResearchGraph, ArchitectAgent, CodingGraph],
    exports: [AnalystAgent, ResearchGraph, ArchitectAgent, CodingGraph],
    controllers: [AnalystController],
})
export class AgentsModule { }
