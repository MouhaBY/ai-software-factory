import { Body, Controller, Post } from '@nestjs/common';
import { WorkflowService } from './workflow.service.js';

@Controller('workflow')
export class WorkflowController {
    constructor(private readonly workflowService: WorkflowService) {}

    @Post('run')
    async run(@Body('ticket') ticket :  string) {
        return this.workflowService.run(ticket);
    }
}
