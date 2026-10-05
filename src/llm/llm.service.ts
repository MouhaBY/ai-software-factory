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
            maxRetries: 3,
        });
    }

    async invokeWithRateLimit<T>(
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
                const isRateLimit =
                    error?.status === 429;

                if (
                    !isRateLimit ||
                    attempt === maxRetries
                ) {
                    throw error;
                }

                const delay =
                    10_000 * (attempt + 1);

                console.warn(
                    `[LLM] Rate limit reached. ` +
                    `Retry ${attempt + 1}/${maxRetries} ` +
                    `in ${delay / 1000}s`,
                );

                await this.sleep(delay);
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
