import { tool } from "@langchain/core/tools";
import z from "zod";
import { RepositoryWorkspaceService } from "../repository/repository-workspace.service.js";
import { runNpmScript } from "./command-runner.js";

export function createRunTypecheckTool(
  workspace: RepositoryWorkspaceService,
) {
  return tool(
    async () => {
      return runNpmScript(
        workspace.getRootPath(),
        'typecheck',
      );
    },
    {
      name: 'run_typecheck',

      description:
        'Run TypeScript static type checking.',

      schema: z.object({}),
    },
  );
}
