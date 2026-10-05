import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface CommandResult {
    status:
    | 'passed'
    | 'failed'
    | 'no_tests'
    | 'error';

    stdout: string;
    stderr: string;
    exitCode: number;
}

export async function runNpmScript(
    workspacePath: string,
    script: string,
): Promise<CommandResult> {
    try {
        const { stdout, stderr } =
            await execFileAsync(
                'npm',
                ['run', script],
                {
                    cwd: workspacePath,
                    timeout: 60_000,
                    maxBuffer: 1024 * 1024,
                },
            );

        return {
            status: 'passed',
            stdout,
            stderr,
            exitCode: 0,
        };
    } catch (error: any) {
        const stdout =
            error.stdout ?? '';

        const stderr =
            error.stderr ?? error.message ?? '';

        const output =
            `${stdout}\n${stderr}`;

        if (
            output.includes(
                'No test files found',
            )
        ) {
            return {
                status: 'no_tests',
                stdout,
                stderr,
                exitCode: error.code ?? 1,
            };
        }

        return {
            status: 'failed',
            stdout,
            stderr,
            exitCode: error.code ?? 1,
        };
    }
}
