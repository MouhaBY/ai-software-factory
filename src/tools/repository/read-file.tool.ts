import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { readFile } from 'node:fs/promises';
import { RepositoryWorkspaceService } from './repository-workspace.service.js';


export function createReadFileTool(
  workspace: RepositoryWorkspaceService,
) {
  return tool(
    async ({
        path,
        startLine = 1,
        endLine = 200,
    }) => {
      const resolvedPath =
        workspace.resolvePath(path);
    
        const content = await readFile(
            resolvedPath,
            'utf-8',
        );

        const lines = content.split('\n');

        const selectedLines =
        lines.slice(
        startLine - 1,
        endLine,
        );

    return selectedLines
        .map(
        (line, index) =>
            `${startLine + index}: ${line}`,
        )
        .join('\n');

    },
    {
      name: 'read_file',

      description:
        'Read a specific range of lines from a repository file. Prefer small relevant ranges instead of reading entire large files.',

      schema: z.object({
        path: z
          .string()
          .describe(
            'Relative path of the file inside the repository',
          ),

          startLine: z
            .number()
            .int()
            .positive()
            .optional(),

        endLine: z
            .number()
            .int()
            .positive()
            .optional(),
      }),
    },
  );
}
