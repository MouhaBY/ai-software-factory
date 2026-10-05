import { Injectable } from "@nestjs/common";
import { RepositoryWorkspaceService } from "./repository-workspace.service.js";
import { createSearchCodeTool } from "./search-code.tool.js";
import { createReadFileTool } from "./read-file.tool.js";
import { createlistFilesTool } from "./list-files.tool.js";
import { createWriteFileTool } from "./write-file.js";

@Injectable()
export class RepositoryToolsService {
    constructor(private readonly workspace: RepositoryWorkspaceService) {}

    getResearchTools() {
        return [
            createlistFilesTool(this.workspace),
            createReadFileTool(this.workspace),
            createSearchCodeTool(this.workspace),
        ]
    }

    getCodingTools() {
        return [
            createlistFilesTool(this.workspace),
            createReadFileTool(this.workspace),
            createSearchCodeTool(this.workspace),
            createWriteFileTool(this.workspace),
        ]
    }
}
