import { ToolNode } from "@langchain/langgraph/prebuilt";
import { Injectable } from "@nestjs/common";
import { LlmService } from "../../llm/llm.service.js";
import { RepositoryToolsService } from "../../tools/repository/repository-tools.service.js";
import { CodingState, CodingStateType } from "./coding.state.js";
import { END, START, StateGraph } from "@langchain/langgraph";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ImplementationPlan } from "../architect/architect.schema.js";
import { CodingResult, CodingResultSchema } from "./coding.schema.js";

@Injectable()
export class CodingGraph {
    private readonly graph;

    constructor(
        private readonly llmService: LlmService,
        private readonly repositoryTools: RepositoryToolsService,
    ) {
        const tools = this.repositoryTools.getCodingTools();
        const toolNode = new ToolNode(tools);
        const model = this.llmService.model.bindTools(tools);

        // const finalModel = this.llmService.model.withStructuredOutput(
        //     CodingResultSchema,
        // );

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

                    return `${
                        message.constructor.name
                    }:\n${content}`;
                    })
                    .join('\n\n');


            const response = await this.llmService.invokeWithRateLimit(
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

            // try { 
            //     const response = await this.llmService.invokeWithRateLimit(() => finalModel.invoke([
            //         ...state.messages,
            //         new HumanMessage(`
            //             Stop using tools.

            //             Summarize the implementation work performed so far.

            //             Determine whether the implementation plan was fully completed.

            //             If some work could not be completed, set completed=false
            //             and describe it in remainingWork.

            //             Do not claim that a file was modified unless it was actually
            //             modified during this execution.
            //         `),
            //     ]));

            //     return {
            //         result: response,
            //     }
            // } catch (error) {
            //     console.error(
            //         '[CODING] finalize failed',
            //         error,
            //     );

            //     throw error;
            // }
            
        }

        const callModel = async (state: CodingStateType) => {
            console.log(
                `[CODING] iteration ${state.iterations + 1}`,
            );

            try{
                const response = await this.llmService.invokeWithRateLimit(() => model.invoke(state.messages));
                return {
                    messages: [response],
                    iterations: 1,
                };
            }catch(error){
                console.error(
                    '[CODING] callModel failed',
                    error,
                );

                throw error;
            }

            
        }

        const MAX_ITERATIONS = 20;

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

            if (AIMessage.isInstance(lastMessage)) {
                console.log(
                    '[CODING] tool calls:',
                    lastMessage.tool_calls?.map((call) => ({
                        name: call.name,
                        args: call.args,
                    })),
                );
            }

            if (
                lastMessage &&
                AIMessage.isInstance(lastMessage) &&
                lastMessage.tool_calls?.length
            ) {
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
        ticket : string,
        plan: ImplementationPlan,
        research?: string,
    ): Promise<string> {
        const result = await this.graph.invoke({
            messages: [
                new SystemMessage(`
                    You are a senior software engineer implementing an approved implementation plan.

                    Rules:
                    - Follow the implementation plan.
                    - Inspect a file before modifying it when it already exists.
                    - Use repository tools instead of inventing repository content.
                    - Keep changes minimal and focused.
                    - Preserve existing project conventions.
                    - Never modify environment files or secrets.
                    - Do not execute shell commands.
                    - Do not delete files.
                    - Do not perform Git operations.
                    - After implementing the plan, provide a concise summary of the changes made.
                    
                    IMPORTANT EXECUTION STRATEGY:

                    - The repository has already been researched.
                    - Use the provided research and implementation plan as your primary navigation information.
                    - Do not explore the repository from scratch.
                    - Do not list directories unless required information is missing.
                    - Read only files that you intend to modify or need as direct dependencies.
                    - Prioritize implementation over exploration.
                    - Once you understand a target file, modify it.
                    - Do not repeatedly search for alternative implementations.
                    - You have a limited tool-call budget.
                `),

                new HumanMessage(`
                    SOFTWARE TICKET:

                    ${ticket}

                    REPOSITORY RESEARCH:
                    
                    ${research ?? 'No repository research available.'}

                    APPROVED IMPLEMENTATION PLAN:

                    ${JSON.stringify(plan, null, 2)}

                    Implement this plan in the repository.

                    Use the repository research to locate relevant files.
                    Do not restart repository exploration from scratch.

                    Read the specific files that you need before modifying them.
                    Prioritize implementation over additional exploration.
                `),
            ],
            },
            {
                recursionLimit: 30,
            },
        );

        // const lastMessage = result.messages.at(-1);

        // if(!lastMessage) {
        //     throw new Error('No messages returned from coding graph');
        // }

        // if (!result.result) {
        //     throw new Error(
        //         'Coding graph did not produce a final result',
        //     );
        // }

        // return result.result;

        if(!result.summary){
            throw new Error(
                'Cofding graph did not produce a finaly summary',
            );
        }

        return result.summary;

    }

}
