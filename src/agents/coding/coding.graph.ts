import { ToolNode } from "@langchain/langgraph/prebuilt";
import { Injectable } from "@nestjs/common";
import { LlmService } from "../../llm/llm.service.js";
import { RepositoryToolsService } from "../../tools/repository/repository-tools.service.js";
import { CodingState, CodingStateType } from "./coding.state.js";
import { END, START, StateGraph } from "@langchain/langgraph";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ImplementationPlan } from "../architect/architect.schema.js";
import { ResearchResult } from "../research/research.schema.js";

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

            try {
                const response = await this.llmService.invokeWithRetry(() => model.invoke(state.messages));

                const toolCalls = response.tool_calls ?? [];

                const toolCallHistory = toolCalls.map((call) => `${call.name}:${JSON.stringify(call.args)}`);

                return {
                    messages: [response],
                    iterations: 1,
                    toolCallHistory,
                };
            } catch (error) {
                console.error(
                    '[CODING] callModel failed',
                    error,
                );

                throw error;
            }


        }

        function hasRepeatedToolCall(
            history: string[],
        ): boolean {
            if (history.length < 2) {
                return false;
            }

            const last =
                history.at(-1);

            const previous =
                history.slice(0, -1);

            return previous.includes(last!);
        }

        const MAX_ITERATIONS = 12;

        const shouldContinue = (
            state: CodingStateType,
        ): 'tools' | 'finalize' => {
            const lastMessage =
                state.messages.at(-1);

            console.log(
                `[CODING] iterations: ${state.iterations}/${MAX_ITERATIONS}`,
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
                hasRepeatedToolCall(
                    state.toolCallHistory,
                )
            ) {
                console.warn(
                    '[CODING] Repeated tool call detected',
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
            console.log('→ END');

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
    ): Promise<string> {
        const result = await this.graph.invoke({
            messages: [
                new SystemMessage(`
                    You are a senior software engineer implementing
                    an approved implementation plan.

                    The repository has ALREADY been researched.

                    STRICT EXECUTION RULES:

                    - Use REPOSITORY RESEARCH as your primary repository context.
                    - Use IMPLEMENTATION PLAN as the source of implementation tasks.
                    - Do NOT explore the repository from scratch.
                    - Do NOT repeatedly list the repository root.
                    - Start by reading files listed in filesToModify.
                    - Read additional files only when directly necessary.
                    - Once you understand a target file, modify it.
                    - Prioritize implementation over exploration.
                    - Never invent repository files.
                    - Keep changes minimal and focused.
                    - Preserve existing project conventions.
                    - Never modify environment files or secrets.
                    - Do not execute shell commands.
                    - Do not perform Git operations.
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

                    ${JSON.stringify(plan, null, 2)}

                    Implement the approved plan now.
                `),
            ],
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

        return result.summary;

    }

}
