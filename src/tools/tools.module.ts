import { Module } from '@nestjs/common';
import { RepositoryToolsService } from './repository/repository-tools.service.js';
import { RepositoryWorkspaceService } from './repository/repository-workspace.service.js';

@Module({
    providers: [
        RepositoryWorkspaceService,
        RepositoryToolsService,
    ],
    exports: [
        RepositoryToolsService,
    ],
})
export class ToolsModule {}
