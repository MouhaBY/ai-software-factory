import { Injectable } from '@nestjs/common';
import { ChatGroq } from '@langchain/groq';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LlmService {
    readonly model: ChatGroq;

    constructor(private readonly configService: ConfigService) {
        this.model = new ChatGroq({
            apiKey: this.configService.getOrThrow('GROQ_API_KEY'),
            model: this.configService.get('GROQ_MODEL') || 'openai/gpt-oss-20b',
            temperature: 0,
            maxRetries: 0,
        });
    }

    async invokeWithRetry<T>(
        invoke: () => Promise<T>,
        maxRetries = 3,
    ): Promise<T> {
        for (
            let attempt = 0;
            attempt <= maxRetries;
            attempt++
        ) {
            try {
                return await invoke();
            } catch (error: any) {
                const status =
                    error?.status;

                const code =
                    error?.error?.error?.code;

                // Rate limit
                if (status === 429) {
                    if (attempt === maxRetries) {
                        throw error;
                    }

                    const delay =
                        10_000 * (attempt + 1);

                    console.warn(
                        `[LLM] Rate limit. Retry ${attempt + 1
                        }/${maxRetries} in ${delay / 1000
                        }s`,
                    );

                    await this.sleep(delay);

                    continue;
                }

                // Groq generated malformed output/tool call
                if (
                    status === 400 &&
                    (
                        code === 'output_parse_failed' ||
                        code === 'tool_use_failed'
                    )
                ) {
                    if (attempt === maxRetries) {
                        throw error;
                    }

                    console.warn(
                        `[LLM] Invalid model output (${code}). ` +
                        `Retry ${attempt + 1}/${maxRetries}`,
                    );

                    continue;
                }

                throw error;
            }
        }

        throw new Error(
            'Unexpected LLM retry state',
        );
    }

    private sleep(
        milliseconds: number,
    ): Promise<void> {
        return new Promise(
            (resolve) =>
                setTimeout(resolve, milliseconds),
        );
    }

}
