import { Injectable } from "@nestjs/common";
import { ExecutionToolsService } from "../../tools/execution/execution-tools.service.js";
import { QaResult } from "./qa.schema.js";

@Injectable()
export class QaService {
    constructor(
        private readonly executionTools: ExecutionToolsService,
    ) { }

    async run(): Promise<QaResult> {
        const {
            runTests,
            runBuild,
            runTypecheck,
        } = this.executionTools.getQaChecks();

        const tests = await runTests();
        const build = await runBuild();
        const typecheck = await runTypecheck();

        const failures: string[] = [];

        if (tests.status !== 'passed') {
            failures.push(
                `Tests: ${tests.stderr || tests.stdout}`,
            );
        }

        if (build.status !== 'passed') {
            failures.push(
                `Build: ${build.stderr || build.stdout}`,
            );
        }

        if (typecheck.status !== 'passed') {
            failures.push(
                `Typecheck: ${typecheck.stderr ||
                typecheck.stdout
                }`,
            );
        }

        return {
            passed:
                tests.status === 'passed' &&
                build.status === 'passed' &&
                typecheck.status === 'passed',

            tests,
            build,
            typecheck,
            failures,
        };
    }
}
