import { tool } from '@langchain/core/tools';
import { z } from 'zod';

import {
  RepositoryWorkspaceService,
} from '../repository/repository-workspace.service.js';

import {
  runNpmScript,
} from './command-runner.js';

export function createRunTestsTool(
  workspace: RepositoryWorkspaceService,
) {
  return tool(
    async () => {
      return runNpmScript(
        workspace.getRootPath(),
        'test',
      );
    },
    {
      name: 'run_tests',

      description:
        'Run the repository automated test suite.',

      schema: z.object({}),
    },
  );
}
