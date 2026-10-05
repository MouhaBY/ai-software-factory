import { Injectable } from "@nestjs/common";
import { LlmService } from "../../llm/llm.service.js";
import { RepositoryToolsService } from "../../tools/repository/repository-tools.service.js";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ResearchState, ResearchStateType } from "./research.state.js";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { END, START, StateGraph } from "@langchain/langgraph";

@Injectable()
export class ResearchGraph {
    private readonly graph;

    constructor(
        private readonly llmService: LlmService,
        private readonly repositoryTools: RepositoryToolsService,
    ) {
        const tools = this.repositoryTools.getResearchTools();
        const toolNode = new ToolNode(tools);
        const model = this.llmService.model.bindTools(tools);

        const callModel = async (state: ResearchStateType) => {

            console.log(
                `Research iteration: ${state.iterations + 1}`,
            );

            try {
                const response = await this.llmService.invokeWithRateLimit(() => model.invoke(state.messages));
                return {
                    messages: [response],
                    iterations: 1,
                };
            } catch (error) {
                console.error(
                    '[RESEARCH] callModel failed',
                    error,
                );

                throw error;
            }
        }

        const MAX_ITERATIONS = 5;

        const shouldContinue = (
            state: ResearchStateType,
        ): 'tools' | '__end__' => {
            if (state.iterations >= MAX_ITERATIONS) {
                console.warn(
                    '[RESEARCH] Maximum iterations reached',
                );

            return END;
        }
            const lastMessage =
                state.messages[
                state.messages.length - 1
                ];

                if (AIMessage.isInstance(lastMessage)) {
                    console.log(
                        '[RESEARCH] tool calls:',
                        lastMessage.tool_calls?.map((call) => ({
                            name: call.name,
                            args: call.args,
                        })),
                    );
                }

            if (
                AIMessage.isInstance(lastMessage) &&
                lastMessage.tool_calls?.length
            ) {
                return 'tools';
            }

            console.log('→ END');

            return END;
        };

        this.graph =
            new StateGraph(ResearchState)

                .addNode(
                    'agent',
                    callModel,
                )

                .addNode(
                    'tools',
                    toolNode,
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

                .compile();

    }

    async research(
        ticket: string,
    ): Promise<string> {
        const result =
            await this.graph.invoke({
                messages: [
                    new SystemMessage(`
                        You are a software engineering research agent.

                        Inspect the repository before implementation.

                        Rules:
                        - Use tools to verify repository facts.
                        - Never invent files or code.
                        - Read relevant files before drawing conclusions.
                        - Never modify the repository.
                        - Produce a concise final research report.

                        Repository exploration strategy:

                        1. Start by listing the repository root.
                        2. Identify the main source directory.
                        3. List relevant directories before searching broadly.
                        4. Use search_code only when you know what symbol or pattern you are looking for.
                        5. Prefer reading relevant files over repeatedly searching for guessed names.
                        6. Do not perform more than two consecutive search_code calls.
                        7. Never repeat equivalent searches.
                        8. If repository information cannot be found, report it as unknown.
                        9. Stop researching once enough information exists to create an implementation plan.
                        10. Use "." when listing the repository root.
                    `),

                    new HumanMessage(
                        `
                        Analyze this engineering ticket.
                        
                        Do not implement it.

                        Ticket:
                        ${ticket}
                        `
                    ),
                ],
            }, {
                recursionLimit: 20,
            });

        const lastMessage =
            result.messages[
            result.messages.length - 1
            ];

        return typeof lastMessage.content === 'string'
            ? lastMessage.content
            : JSON.stringify(lastMessage.content);
    }
}
