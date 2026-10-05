import { tool } from "@langchain/core/tools";
import { RepositoryWorkspaceService } from "./repository-workspace.service.js";
import { readdir } from "node:fs/promises";
import z from "zod";

export function createlistFilesTool(
    workspace: RepositoryWorkspaceService,
) {
    return tool(
        async ({ path }) => {
            const resolvedPath = workspace.resolvePath(path);
            const entries = await readdir(resolvedPath, { withFileTypes: true });

            const result = entries.map((entry) => ({
                name: entry.name,
                type: entry.isDirectory() ? 'directory' : 'file',
            }));

            return JSON.stringify(result);
        },
        {
            name: "list_files",
            description: "List files and directories inside a repository directory.",
            schema: z.object({
                path: z
                .string()
                .default('.')
                .describe(
                    'Repository-relative directory. Use "." for repository root.',
                ),
            }),
        },
    );
}
