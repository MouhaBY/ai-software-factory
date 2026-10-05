import { Annotation } from "@langchain/langgraph";
import { AnalysisResult } from "../agents/analyst/analyst.schema.js";
import { ImplementationPlan } from "../agents/architect/architect.schema.js";
import { CodingResult } from "../agents/coding/coding.schema.js";

export const WorkflowState = Annotation.Root({
    ticket: Annotation<string>(),

    analysis: Annotation<AnalysisResult | undefined>(),

    researchResult: Annotation<string | undefined>(),

    plan: Annotation<ImplementationPlan | undefined>(),

    // codingResult: Annotation<CodingResult | undefined>(),
    codingResult: Annotation<string | undefined>(),

});

export type WorkflowStateType = typeof WorkflowState.State;
