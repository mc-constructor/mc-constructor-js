import { CommandRequest, SimpleCommandRequest } from '@ts-mc/core/command'
import { ClientResponse } from '@ts-mc/core/client'

export class RawCommand extends SimpleCommandRequest<ClientResponse> {
  constructor(protected readonly command: string, protected readonly hasResponse: boolean | number) {
    super()
  }

  protected formatArgs(): string {
    return '';
  }

  protected parseResponse(response: ClientResponse): ClientResponse {
    return response
  }
}

export function rawCmd(cmd: string, hasResponse: boolean | number = true): CommandRequest {
  return new RawCommand(cmd, hasResponse);
}
