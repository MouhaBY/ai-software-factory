import { Injectable } from '@nestjs/common';

import {
    RepositoryWorkspaceService,
} from '../repository/repository-workspace.service.js';

import {
    createRunTestsTool,
} from './run-tests.tool.js';

import {
    createRunBuildTool,
} from './run-build.tool.js';

import {
    createRunTypecheckTool,
} from './run-typecheck.tool.js';
import { runNpmScript } from './command-runner.js';

@Injectable()
export class ExecutionToolsService {
    constructor(
        private readonly workspace:
            RepositoryWorkspaceService,
    ) { }

    getQaTools() {
        return [
            createRunTestsTool(this.workspace),
            createRunBuildTool(this.workspace),
            createRunTypecheckTool(this.workspace),
        ];
    }

    async runTests() {
        return runNpmScript(
            this.workspace.getRootPath(),
            'test',
        );
    }

    async runBuild() {
        return runNpmScript(
            this.workspace.getRootPath(),
            'build',
        );
    }

    async runTypecheck() {
        return runNpmScript(
            this.workspace.getRootPath(),
            'typecheck',
        );
    }

    getQaChecks() {
        return {
            runTests:
                () => this.runTests(),

            runBuild:
                () => this.runBuild(),

            runTypecheck:
                () => this.runTypecheck(),
        };
    }
}
