import { Injectable } from "@nestjs/common";
import { AnalystNode } from "./nodes/analyst.node.js";
import { END, START, StateGraph } from "@langchain/langgraph";
import { WorkflowState, WorkflowStateType } from "./workflow.state.js";
import { ResearchNode } from "./nodes/research.node.js";
import { ArchitectNode } from "./nodes/architect.node.js";
import { CodingNode } from "./nodes/coding.node.js";
import { QaNode } from "./nodes/qa.nodes.js";
import { PlanValidatorNode } from "./nodes/plan-validator.node.js";

@Injectable()
export class WorkflowService {
    private readonly graph;

    constructor(
        private readonly analystNode: AnalystNode,
        private readonly researchNode: ResearchNode,
        private readonly architectNode: ArchitectNode,
        private readonly codingNode: CodingNode,
        private readonly qaNode: QaNode,
        private readonly planValidatorNode: PlanValidatorNode,
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
        .addNode(
            'qa',
            this.qaNode.execute.bind(this.qaNode),
        )
        .addNode(
            'planValidator',
            this.planValidatorNode.execute.bind(
                this.planValidatorNode,
            ),
        )
        .addEdge(START, 'analyst')
        .addEdge('analyst', 'research')
        .addEdge('research', 'architect')
        .addEdge(
            'architect',
            'planValidator',
        )
        .addEdge(
            'planValidator',
            'coding',
        )
        .addEdge('coding', 'qa')
        .addEdge('qa', END)
        .compile();
    }

    async run(ticket: string){
        return this.graph.invoke({ ticket })
    }
}
