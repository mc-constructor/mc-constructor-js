import { stubLoggerFactory } from '@ts-mc/common/testing'
import { requestClientFixture } from '@ts-mc/core/client/testing'
import { expect } from 'chai'

import { Weather, weather } from './weather'

describe('weather cmd', () => {

  function validateMembers(subCmd: Weather): void {
    describe(subCmd, () => {
      it('exists as a member on the weather command', () => {
        expect(weather[subCmd], `weather.${subCmd}`).to.exist
      })

      it('can be used directly as a CommandRequest', () => {
        expect(weather[subCmd].compileRequest, `weather.${subCmd}.compileRequest`).to.be.a('function')
        expect(weather[subCmd].execute, `weather.${subCmd}.execute`).to.be.a('function')
      })

      it('can be invoked with a duration parameter to create a CommandRequest', () => {
        expect(weather[subCmd](100).compileRequest, `weather.${subCmd}(duration).compileRequest`).to.be.a('function')
        expect(weather[subCmd](100).execute, `weather.${subCmd}(duration).execute`).to.be.a('function')
      })
    })
  }

  validateMembers(Weather.clear)
  validateMembers(Weather.rain)
  validateMembers(Weather.thunder)
  validateMembers(Weather.tornado)

  describe.marbles('command execution', ({ cold }) => {

    stubLoggerFactory()

    function testCmd(subCmd: Weather, duration?: number) {
      it(`sends the expected '${subCmd}'${duration ? ' with duration' : ''} command`, () => {
        const responseValues = {
          a: undefined as any,
        }
        const client = requestClientFixture(cold('a|'), responseValues)
        const cmd = duration ? weather[subCmd](duration) : weather[subCmd]
        const test$ = cmd.execute(client)

        const values = {
          a: `weather ${subCmd}${duration ? ` ${duration}` : ''}`,
        }

        expect(client.write$, 'command body').with.marbleValues(values).to.equal('a')
        expect(test$, 'command response').with.marbleValues(responseValues).to.equal('(a|)')
      })
    }

    testCmd(Weather.clear)
    testCmd(Weather.clear, 100)
    testCmd(Weather.rain)
    testCmd(Weather.rain, 100)
    testCmd(Weather.thunder)
    testCmd(Weather.thunder, 100)
    testCmd(Weather.tornado)
    testCmd(Weather.tornado, 100)
  })
})
