import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import {
    mkdir,
    writeFile,
} from 'node:fs/promises';
import path from 'node:path';

import {
    RepositoryWorkspaceService,
} from './repository-workspace.service.js';

export function createWriteFileTool(
    workspace: RepositoryWorkspaceService,
) {
    return tool(
        async ({ path: filePath, content }) => {

            workspace.assertWritable(filePath);

            const resolvedPath =
                workspace.resolvePath(filePath);

            await mkdir(
                path.dirname(resolvedPath),
                {
                    recursive: true,
                },
            );

            await writeFile(
                resolvedPath,
                content,
                'utf-8',
            );

            return `File written successfully: ${filePath}`;
        },
        {
            name: 'write_file',

            description:
                'Create or replace a source code file inside the repository.',

            schema: z.object({
                path: z
                    .string()
                    .describe(
                        'Relative file path inside the repository',
                    ),

                content: z
                    .string()
                    .describe(
                        'Complete content to write into the file',
                    ),
            }),
        },
    );
}
