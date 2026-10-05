import { Module } from '@nestjs/common';
import { RepositoryToolsService } from './repository/repository-tools.service.js';
import { RepositoryWorkspaceService } from './repository/repository-workspace.service.js';
import { ExecutionToolsService } from './execution/execution-tools.service.js';

@Module({
    providers: [
        RepositoryWorkspaceService,
        RepositoryToolsService,
        ExecutionToolsService,
    ],
    exports: [
        RepositoryToolsService,
        ExecutionToolsService,
    ],
})
export class ToolsModule {}
