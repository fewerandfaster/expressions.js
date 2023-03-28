import { describe, test, expect } from '@jest/globals'
import { readFile } from 'fs/promises'
import Ajv from 'ajv/dist/2020'
import addFormats from 'ajv-formats'

const schema = JSON.parse(await readFile(new URL('../expressions.schema.json', import.meta.url)))
const ajv = new Ajv({ allErrors: true, verbose: true })
addFormats(ajv)
const validator = ajv.compile(schema)

expect.extend({
  toBeValid (received, validate = validator) {
    return {
      pass: validate(received),
      message: () => JSON.stringify(validate.errors, null, 2)
    }
  }
})

function isValid (examples) {
  describe('valid', () => {
    examples.forEach(example => {
      test(JSON.stringify(example), () => {
        expect(example).toBeValid()
      })
    })
  })
}

function isInvalid (examples) {
  describe('invalid', () => {
    examples.forEach(example => {
      test(JSON.stringify(example), () => {
        expect(example).not.toBeValid()
      })
    })
  })
}

describe('expressions.schema.json', () => {
  test('is a valid schema', () => {
    expect(schema).toBeValid(ajv.getSchema(schema.$schema))
  })

  isInvalid([{}, [], { Any: [], All: [] }])

  describe('constants', () => {
    isValid(['string', true, false, 1, 1.1])
    isInvalid([null])
  });

  ['Any', 'All'].forEach(name => {
    describe(name, () => {
      isValid([
        { [name]: [] },
        { [name]: [1, true, 'string'] },
        { [name]: [{ Boolean: true }, { Property: 'admin' }] }
      ])

      isInvalid([
        { [name]: null },
        { [name]: 'nope' }
      ])
    })
  });

  ['Boolean', 'String', 'Number'].forEach(name => {
    describe(name, () => {
      isValid([
        { [name]: true },
        { [name]: false },
        { [name]: 'true' },
        { [name]: 'false' },
        { [name]: 0 },
        { [name]: 1 },
        { [name]: [true] },
        { [name]: [false] },
        { [name]: ['true'] },
        { [name]: ['false'] },
        { [name]: [0] },
        { [name]: [1] },
        { [name]: { Any: [] } },
        { [name]: [{ Any: [] }] }
      ])

      isInvalid([
        { [name]: null },
        { [name]: [true, false] },
        { [name]: true, Any: [] }
      ])
    })
  });

  ['Equal', 'GreaterThanOrEqualTo', 'GreaterThan', 'LessThanOrEqualTo', 'LessThan', 'NotEqual'].forEach(name => {
    describe(name, () => {
      isValid([
        { [name]: [1, 1] },
        { [name]: ['a', 'b'] },
        { [name]: [{ Property: 'age' }, 21] }
      ])

      isInvalid([
        { [name]: [1, 2, 3] },
        { [name]: [1] },
        { [name]: 1 },
        { [name]: null },
        { [name]: [1, 2], Any: [] }
      ])
    })
  })

  describe('Property', () => {
    isValid([
      { Property: 'name' },
      { Property: ['flipper_id'] }
    ])

    isInvalid([
      { Property: false },
      { Property: [false] },
      { Property: [] },
      { Property: null }
    ])
  })

  describe('Time', () => {
    isValid([
      { Time: '2021-01-01T00:00:00Z' },
      { Time: ['2021-01-01T00:00:00Z'] },
      { Time: '2021-01-01T00:00:00-05:00' },
      { Time: ['2021-01-01T00:00:00-05:00'] },
      { Time: { Property: 'created_at' } },
      { Time: [{ Property: 'created_at' }] }
    ])

    isInvalid([
      { Time: '2021-01-01' },
      { Time: 'January 1, 2021 10:00' },
      { Time: null },
      { Time: false },
      { Time: [{ Property: 'created_at' }, { Property: 'updated_at' }] }
    ])
  })

  // describe('Duration', () => {
  //   [
  //     {Duration: 2},
  //     {Duration: [60]},
  //     {Duration: [2, 'seconds']},
  //     {Duration: [2, 'minutes']},
  //     {Duration: [2, 'hours']},
  //     {Duration: [2, 'days']},
  //     {Duration: [2, 'weeks']},
  //     {Duration: [2, 'months']},
  //     {Duration: [2, 'years']},
  //   ].forEach(isValid);
  // })

  // TODO:
  // Random
  // Now
  // Percentage
  // PercentageOfActors
})