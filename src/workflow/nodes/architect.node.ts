import { Injectable } from "@nestjs/common";
import { ArchitectAgent } from "../../agents/architect/architect.agent.js";
import { WorkflowStateType } from "../workflow.state.js";

@Injectable()
export class ArchitectNode {
    constructor(
        private readonly architectAgent: ArchitectAgent,
    ) {}

    async execute(state: WorkflowStateType): Promise<Partial<WorkflowStateType>> {
        if(!state.analysis){
            throw new Error("Analysis result is missing in the state.");
        }

        const plan = await this.architectAgent.createPlan(
            state.ticket,
            state.analysis,
            state.researchResult
        )

        return {
            plan,
        }
    }
}
