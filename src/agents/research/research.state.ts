import { BaseMessage } from "@langchain/core/messages";
import { Annotation, messagesStateReducer } from "@langchain/langgraph";

export const ResearchState = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: messagesStateReducer,
        default: () => [],
    }),

    iterations: Annotation<number>({
        reducer: (current, update) => current + update,
        default: () => 0,
    }),
});

export type ResearchStateType = typeof ResearchState.State;
