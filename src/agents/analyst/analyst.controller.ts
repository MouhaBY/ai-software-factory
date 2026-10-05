import { Body, Controller, Post } from '@nestjs/common';
import { AnalystAgent } from './analyst.agent.js';

@Controller('analyst')
export class AnalystController {
    constructor(private readonly analystAgent: AnalystAgent) {}

    @Post('analyze')
    async analyzeTicket(@Body('ticket') ticket: string) {
        return this.analystAgent.analyze(ticket);
    }
}
