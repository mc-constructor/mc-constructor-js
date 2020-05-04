import { Command, SimpleCommand } from '../../command'
import { ClientMessageResponse } from '../../client'

export class RawCommand extends SimpleCommand<ClientMessageResponse> {
  constructor(protected readonly command: string, protected readonly hasResponse: boolean | number) {
    super()
  }

  protected formatArgs(): string {
    return '';
  }

  protected parseResponse(response: ClientMessageResponse): ClientMessageResponse {
    return response
  }
}

export function rawCmd(cmd: string, hasResponse: boolean | number = true): Command {
  return new RawCommand(cmd, hasResponse);
}
