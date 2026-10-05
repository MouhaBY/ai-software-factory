import { BaseMessage } from "@langchain/core/messages";
import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import { ResearchResult } from "./research.schema.js";

export const ResearchState = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: messagesStateReducer,
        default: () => [],
    }),

    iterations: Annotation<number>({
        reducer: (current, update) => current + update,
        default: () => 0,
    }),

    result: Annotation<
        ResearchResult | undefined
    >(),
});

export type ResearchStateType = typeof ResearchState.State;
