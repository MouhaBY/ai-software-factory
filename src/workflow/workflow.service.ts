import { Injectable } from "@nestjs/common";
import { AnalystNode } from "./nodes/analyst.node.js";
import { END, START, StateGraph } from "@langchain/langgraph";
import { WorkflowState, WorkflowStateType } from "./workflow.state.js";
import { ResearchNode } from "./nodes/research.node.js";
import { ArchitectNode } from "./nodes/architect.node.js";
import { CodingNode } from "./nodes/coding.node.js";

@Injectable()
export class WorkflowService {
    private readonly graph;

    constructor(
        private readonly analystNode: AnalystNode,
        private readonly researchNode: ResearchNode,
        private readonly architectNode: ArchitectNode,
        private readonly codingNode: CodingNode,
    ) {
        this.graph = new StateGraph(WorkflowState)
        .addNode(
            'analyst',
            this.analystNode.execute.bind(this.analystNode),
        )
        .addNode(
            'research',
            this.researchNode.execute.bind(this.researchNode),
        )
        .addNode(
            'architect',
            this.architectNode.execute.bind(this.architectNode),
        )
        .addNode(
            'coding',
            this.codingNode.execute.bind(this.codingNode),
        )
        .addEdge(START, 'analyst')
        .addConditionalEdges('analyst', this.routeAfterAnalysis.bind(this))
        .addEdge('research', 'architect')
        .addEdge('architect', 'coding')
        .addEdge('coding', END)
        .compile();
    }

    private routeAfterAnalysis(state: WorkflowStateType): 'research' | 'architect' {
        if(state.analysis?.requiresResearch) {
            return 'research';
        }
        return 'architect';
    }

    async run(ticket: string){
        return this.graph.invoke({ ticket })
    }
}
