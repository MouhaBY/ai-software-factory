import { BadRequestException, Injectable } from "@nestjs/common";
import path from "path";

@Injectable()
export class RepositoryWorkspaceService {
    private readonly rootPath = path.resolve('./workspace');

    private readonly forbiddenFiles = [
        '.env',
        '.env.local',
        '.env.production',
    ];

    assertWritable(relativePath: string): void {
        const normalized = relativePath.replace('\\', '/');

        const fileName = path.posix.basename(normalized);

        if(this.forbiddenFiles.includes(fileName)) {
            throw new BadRequestException(
                `Writing to ${fileName} is forbidden`,
            );
        }
    }

    resolvePath(relativePath: string): string {
        const resolvedPath = path.resolve(this.rootPath, relativePath);

        const relative = path.relative(this.rootPath, resolvedPath);
        
        if(
            relative.startsWith('..') ||
            path.isAbsolute(relative)
        ) {
            throw new BadRequestException(
                'Access outside repository is forbidden',
            );
        }

        return resolvedPath;
    }

    getRootPath(): string {
        return this.rootPath;
    }
}
