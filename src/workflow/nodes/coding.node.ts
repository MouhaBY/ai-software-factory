import { Injectable } from "@nestjs/common";
import { CodingGraph } from "../../agents/coding/coding.graph.js";
import { WorkflowStateType } from "../workflow.state.js";

@Injectable()
export class CodingNode {
    constructor(
        private readonly codingGraph: CodingGraph,
    ) {}

    async execute (state: WorkflowStateType): Promise<Partial<WorkflowStateType>> {

        if(!state.plan){
            throw new Error("Implementation plan is missing in the state.");
        }

        if (!state.researchResult) {
            throw new Error(
            'Repository research is required',
            );
        }

        
        const result = await this.codingGraph.implement(state.ticket, state.plan, state.researchResult);

        return {
            changes: result.summary,
            codingWriteCount: result.writeCount,
        }
    }
}
