import { SimpleArgsCommandRequest } from '@ts-mc/core/command'

import { ClientSuccessResponse } from '../../index'

export class TestCommand extends SimpleArgsCommandRequest {
  protected readonly command = 'test'

  constructor(
    public readonly hasResponse: boolean | number,
    public readonly id: string,
    ...args: any[]
  ) {
    super(id, ...args)
  }

  protected parseSuccessResponse(response: ClientSuccessResponse): any {
    return response.extras[0]
  }

}
