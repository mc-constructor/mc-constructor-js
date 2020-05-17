import { SinonStub, SinonStubbedMember } from 'sinon'

export interface AnyFn {
  (...args: any[]): any
}

export type FixtureMember<T> = T extends AnyFn ? SinonStub<Parameters<T>, ReturnType<T>> : T

export type Fixture<TType> = {
  [TKey in keyof TType]: SinonStubbedMember<TType[TKey]>
}
