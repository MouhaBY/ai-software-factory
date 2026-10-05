import { Injectable } from "@nestjs/common";
import { WorkflowStateType } from "../workflow.state.js";
import { AnalystAgent } from "../../agents/analyst/analyst.agent.js";

@Injectable()
export class AnalystNode {
    constructor(private readonly analystAgent: AnalystAgent) {}

    async execute(state: WorkflowStateType): Promise<Partial<WorkflowStateType>> {
        const analysis = await this.analystAgent.analyze(state.ticket);
        return {
            analysis
        };
    }
}
