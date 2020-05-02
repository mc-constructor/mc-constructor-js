import { SimpleArgsCommand } from '../../../command'

import { ClientMessageSuccessResponse } from '../..'

export class TestCommand extends SimpleArgsCommand {
  protected readonly command = 'test'

  constructor(
    public readonly hasResponse: boolean | number,
    public readonly id: string,
    ...args: any[]
  ) {
    super(id, ...args)
  }

  protected parseSuccessResponse(response: ClientMessageSuccessResponse): any {
    return response.extras[0]
  }

}
