export type ExpectResponse<TResponse> = TResponse extends void ? false : true

export interface Client {
  send<TResponse>(cmd: string, expectResponse: ExpectResponse<TResponse>): Promise<TResponse extends void ? void : string>
}
