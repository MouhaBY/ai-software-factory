import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentsModule } from './agents/agents.module.js';
import { LlmModule } from './llm/llm.module.js';
import { WorkflowModule } from './workflow/workflow.module.js';
import { ToolsModule } from './tools/tools.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LlmModule,
    AgentsModule,
    WorkflowModule,
    ToolsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
