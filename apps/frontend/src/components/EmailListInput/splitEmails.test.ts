import { splitEmails } from './splitEmails'

describe('splitEmails', () => {
  it('splits on commas and spaces and drops empty entries', () => {
    expect(
      splitEmails(' a@agency.gov.sg, b@agency.gov.sg,,c@agency.gov.sg ,'),
    ).toEqual(['a@agency.gov.sg', 'b@agency.gov.sg', 'c@agency.gov.sg'])
  })
})
