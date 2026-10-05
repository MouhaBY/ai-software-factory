import { Annotation } from "@langchain/langgraph";
import { AnalysisResult } from "../agents/analyst/analyst.schema.js";
import { ImplementationPlan } from "../agents/architect/architect.schema.js";
import { QaResult } from "../agents/qa/qa.schema.js";
import { ResearchResult } from "../agents/research/research.schema.js";

export const WorkflowState = Annotation.Root({
    ticket: Annotation<string>(),

    analysis: Annotation<AnalysisResult | undefined>(),

    researchResult: Annotation<ResearchResult | undefined>(),

    plan: Annotation<ImplementationPlan | undefined>(),

    changes: Annotation<string | undefined>(),

    codingWriteCount: Annotation<number>(),

    qaResult: Annotation<QaResult | undefined>(),

});

export type WorkflowStateType = typeof WorkflowState.State;
