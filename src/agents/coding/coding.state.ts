import { BaseMessage } from "@langchain/core/messages";
import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import { CodingResult } from "./coding.schema.js";

export const CodingState = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: messagesStateReducer,
        default: () => [],
    }),

    iterations: Annotation<number>({
        reducer: (current, update) => current + update,
        default: () => 0,
    }),

    // result: Annotation<CodingResult | undefined>(),
    summary: Annotation<string | undefined>(),
})

export type CodingStateType = typeof CodingState.State;
