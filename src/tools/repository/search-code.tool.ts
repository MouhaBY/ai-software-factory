import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { RepositoryWorkspaceService } from
  './repository-workspace.service.js';

const execFileAsync = promisify(execFile);

export function createSearchCodeTool(
  workspace: RepositoryWorkspaceService,
) {
  return tool(
    async ({ query }) => {
      const root =
        workspace.resolvePath('.');

      try {
        const { stdout } =
          await execFileAsync(
            'grep',
            [
              '-R',
              '-n',
              '--exclude-dir=node_modules',
              '--exclude-dir=.git',
              query,
              '.',
            ],
            {
              cwd: root,
              timeout: 5000,
            },
          );

        const lines =
            stdout
                .split('\n')
                .filter(Boolean)
                .slice(0, 50);

            return lines.join('\n');
      } catch {
        return 'No matches found.';
      }
    },
    {
      name: 'search_code',

      description:
        'Search for text occurrences inside the repository source code.',

      schema: z.object({
        query: z
          .string()
          .describe(
            'Text or code pattern to search for',
          ),
      }),
    },
  );
}
