import { Injectable } from '@nestjs/common';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

@Injectable()
export class AwsParameterService {
  private readonly ssm: SSMClient;

  constructor() {
    this.ssm = new SSMClient({ region: 'ap-southeast-1' });
  }

  async getParameter(name: string): Promise<string> {
    const command = new GetParameterCommand({
      Name: name,
      WithDecryption: true,
    });

    const response = await this.ssm.send(command);
    return response.Parameter?.Value || '';
  }
}
