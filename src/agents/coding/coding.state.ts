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

    summary: Annotation<string | undefined>(),

    toolCallHistory: Annotation<string[]>({
        reducer: (current, update) => [
            ...current,
            ...update,
        ],
        default: () => [],
    }),
})

export type CodingStateType = typeof CodingState.State;
