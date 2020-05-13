import { SimpleArgsCommandRequest } from '@ts-mc/core/command'

import { ClientSuccessResponse } from '../../index'

export class TestCommand extends SimpleArgsCommandRequest {
  protected readonly command = 'test'
  protected allowedErrorKeys = ['test.error']

  constructor(
    public readonly hasResponse: boolean | number,
    public readonly id: string,
    ...args: any[]
  ) {
    super(id, ...args)
  }

}
