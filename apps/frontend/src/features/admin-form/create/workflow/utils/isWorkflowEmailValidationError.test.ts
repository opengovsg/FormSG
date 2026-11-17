import { isWorkflowEmailValidationError } from './isWorkflowEmailValidationError'

describe('workflow email validation errors', () => {
  it('recognises the server error for an individual recipient', () => {
    expect(
      isWorkflowEmailValidationError(
        new Error('"emails[0]" must be a valid email'),
      ),
    ).toBe(true)
  })
  it('keeps unrelated save errors visible', () => {
    expect(isWorkflowEmailValidationError(new Error('Network error'))).toBe(
      false,
    )
    expect(
      isWorkflowEmailValidationError(
        new Error('"esrvcId" must be a valid email'),
      ),
    ).toBe(false)
  })
})
