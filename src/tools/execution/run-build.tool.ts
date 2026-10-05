import { tool } from "@langchain/core/tools";
import { RepositoryWorkspaceService } from "../repository/repository-workspace.service.js";
import { runNpmScript } from "./command-runner.js";
import z from "zod";

export function createRunBuildTool(
  workspace: RepositoryWorkspaceService,
) {
  return tool(
    async () => {
      return runNpmScript(
        workspace.getRootPath(),
        'build',
      );
    },
    {
      name: 'run_build',

      description:
        'Run the repository build command.',

      schema: z.object({}),
    },
  );
}
