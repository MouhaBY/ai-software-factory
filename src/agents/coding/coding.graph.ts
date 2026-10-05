import { ToolNode } from "@langchain/langgraph/prebuilt";
import { Injectable } from "@nestjs/common";
import { LlmService } from "../../llm/llm.service.js";
import { RepositoryToolsService } from "../../tools/repository/repository-tools.service.js";
import { CodingState, CodingStateType } from "./coding.state.js";
import { END, START, StateGraph } from "@langchain/langgraph";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ImplementationPlan } from "../architect/architect.schema.js";
import { ResearchResult } from "../research/research.schema.js";

export interface CodingExecutionResult {
  summary: string;
  writeCount: number;
}

@Injectable()
export class CodingGraph {
    private readonly graph;

    constructor(
        private readonly llmService: LlmService,
        private readonly repositoryTools: RepositoryToolsService,
    ) {
        const tools = this.repositoryTools.getCodingTools();
        const toolNode = new ToolNode(tools);
        const model = this.llmService.model.bindTools(tools,
            {
                tool_choice: 'auto',
                parallel_tool_calls: false,
            },
        );

        const finalModel = this.llmService.model;

        const finalize = async (state: CodingStateType) => {
            console.log('[CODING] finalizing...');

            const recentMessages =
                state.messages
                    .slice(-8)
                    .map((message) => {
                        const content =
                            typeof message.content === 'string'
                                ? message.content
                                : JSON.stringify(
                                    message.content,
                                );

                        if (
                            AIMessage.isInstance(message) &&
                            message.tool_calls?.length
                        ) {
                            const calls =
                                message.tool_calls.map(
                                    (call) =>
                                        `${call.name}(${JSON.stringify(
                                            call.args,
                                        )})`,
                                );

                            return [
                                `AI requested operations:`,
                                ...calls,
                            ].join('\n');
                        }

                        return `${message.constructor.name
                            }:\n${content}`;
                    })
                    .join('\n\n');


            const response = await this.llmService.invokeWithRetry(
                () => finalModel.invoke([
                    new SystemMessage(`
                        You are a reporting component.

                        You are NOT a coding agent.
                        You cannot use tools.
                        You cannot modify files.
                        You cannot inspect additional files.

                        Your only task is to summarize the execution
                        information provided as plain text.

                        Do not request tools.
                        Do not output tool calls.
                        Do not continue the implementation.
                    `),
                    new HumanMessage(`
                        CODING EXECUTION HISTORY:
                
                        ${recentMessages}

                        Produce a concise final report containing:

                        1. What was actually implemented.
                        2. What remains unfinished.
                        3. Any warnings.

                        Do not perform additional work.
                    `),
                ]),
            );

            const summary =
                typeof response.content === 'string'
                    ? response.content
                    : JSON.stringify(response.content);

            return {
                summary,
            };

        }

        const callModel = async (state: CodingStateType) => {
            console.log(
                `[CODING] iteration ${state.iterations + 1}`,
            );

            const messages = [
                ...state.messages,
            ];

            if (
                state.iterations >=
                MAX_EXPLORATION_ITERATIONS &&
                state.writeCount === 0
            ) {
                console.warn(
                    '[CODING] Exploration budget exhausted. Forcing implementation phase.',
                );

                messages.push(
                    new SystemMessage(`
                        IMPLEMENTATION PHASE REQUIRED.

                        You have already inspected enough repository context.

                        Repository discovery has already been performed by
                        the Research Agent.

                        You must now implement the approved plan.

                        Do NOT continue repository exploration.

                        Use read_file only if absolutely necessary for a target file.

                        Your next actions must prioritize write_file.

                        Do not finish without attempting the implementation.
                    `),
                );
            }

            try {
                const response = await this.llmService.invokeWithRetry(() => model.invoke(messages));

                const toolCalls = response.tool_calls ?? [];

                const writeCalls = toolCalls.filter(
                    (call) =>
                        call.name === 'write_file',
                );

                console.log(
                    '[CODING] tool calls:',
                    toolCalls.map(
                        (call) => ({
                            name: call.name,
                            args: call.args,
                        }),
                    ),
                );

                return {
                    messages: [response],
                    iterations: 1,
                    writeCount: writeCalls.length,
                };

            } catch (error) {
                console.error(
                    '[CODING] callModel failed',
                    error,
                );

                throw error;
            }


        }

        const MAX_ITERATIONS = 12;
        const MAX_EXPLORATION_ITERATIONS = 5;

        const shouldContinue = (
            state: CodingStateType,
        ): 'tools' | 'finalize' => {
            const lastMessage =
                state.messages.at(-1);

            console.log(
                `[CODING] iterations: ` +
                `${state.iterations}/${MAX_ITERATIONS}`,
            );

            if (
                state.iterations >= MAX_ITERATIONS
            ) {
                console.warn(
                    '[CODING] Maximum iterations reached',
                );

                return 'finalize';
            }

            if (
                lastMessage &&
                AIMessage.isInstance(lastMessage) &&
                lastMessage.tool_calls?.length
            ) {
                console.log(
                    '[CODING] tool calls:',
                    lastMessage.tool_calls.map(
                        (call) => ({
                            name: call.name,
                            args: call.args,
                        }),
                    ),
                );
                return 'tools';
            }

            return 'finalize';
        };

        this.graph = new StateGraph(CodingState)
            .addNode(
                'agent',
                callModel,
            )
            .addNode(
                'tools',
                toolNode,
            )
            .addNode(
                'finalize',
                finalize,
            )
            .addEdge(
                START,
                'agent',
            )
            .addConditionalEdges(
                'agent',
                shouldContinue,
            )
            .addEdge(
                'tools',
                'agent',
            )
            .addEdge(
                'finalize',
                END
            )
            .compile();
    }

    async implement(
        ticket: string,
        plan: ImplementationPlan,
        research?: ResearchResult,
    ): Promise<CodingExecutionResult> {
        const result = await this.graph.invoke({
            messages: [
                new SystemMessage(`
                    You are a senior software engineer responsible ONLY
                    for implementing an approved implementation plan.

                    Repository discovery has already been completed by
                    the Research Agent.

                    The Architect has already selected the files involved.

                    YOUR RESPONSIBILITY IS IMPLEMENTATION, NOT RESEARCH.

                    Rules:

                    1. Read the files listed in IMPLEMENTATION PLAN.filesToModify.
                    2. Understand their current content.
                    3. Implement the requested changes using write_file.
                    4. Modify only files required by the approved plan.
                    5. Preserve existing project conventions.
                    6. Do not invent repository files.
                    7. Do not restart repository exploration.
                    8. Do not finish merely because some information is missing.
                    Use the provided repository research and target files.
                    9. After reading the necessary target files, proceed to write_file.
                    10. The task is NOT complete until the required implementation
                        has been attempted.
                `),

                new HumanMessage(`
                    SOFTWARE TICKET:

                    ${ticket}

                    VERIFIED REPOSITORY RESEARCH:

                    ${JSON.stringify(
                        research,
                        null,
                        2,
                    )}

                    APPROVED IMPLEMENTATION PLAN:

                    ${JSON.stringify(
                        plan,
                        null,
                        2,
                    )}

                    Implement the approved plan now.
                `)
            ],
            iterations: 0,

            writeCount: 0,
        },
            {
                recursionLimit: 30,
            },
        );

        if (!result.summary) {
            throw new Error(
                'Cofding graph did not produce a finaly summary',
            );
        }

        return {
            summary: result.summary,
            writeCount: result.writeCount ?? 0,
        };

    }

}
