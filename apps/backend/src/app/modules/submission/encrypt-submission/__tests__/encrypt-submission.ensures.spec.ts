import { FormStatus } from 'formsg-shared/types'

import { IPopulatedForm } from 'src/types'

import { ensurePublicForm } from '../encrypt-submission.ensures'

/**
 * Guards the submit-path half of scheduled closure. `isFormPublic` is unit
 * tested directly elsewhere; these assert that the submission pipeline actually
 * consults it, so a form past its deadline is refused before anything is
 * written — even while the periodic sweep has yet to flip its status.
 */
const createMockRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
})

const createMockContext = (form: Partial<IPopulatedForm>) => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  req: {} as any,
  res: createMockRes(),
  logMeta: { action: 'test' },
  form: {
    title: 'a form',
    inactiveMessage: 'This form is not available.',
    ...form,
  } as IPopulatedForm,
})

describe('Encrypt Submission Ensures', () => {
  afterEach(() => jest.clearAllMocks())

  describe('ensurePublicForm', () => {
    it('should reject a submission to a form past its scheduled expiry', async () => {
      const next = jest.fn()
      const ctx = createMockContext({
        status: FormStatus.Public,
        closeAt: new Date(Date.now() - 60 * 1000),
      } as unknown as Partial<IPopulatedForm>)

      await ensurePublicForm(ctx as never, next)

      expect(next).not.toHaveBeenCalled()
      expect(ctx.res.status).toHaveBeenCalledWith(404)
      // NOTE: the submit path returns the generic "taken down" copy rather than
      // the form's inactiveMessage. That is pre-existing behaviour for any
      // closed form on this path, not specific to scheduled closure — the load
      // path does surface inactiveMessage. Asserted as-is so a future change to
      // that copy is a deliberate one.
      expect(ctx.res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          messageKey: 'features.publicForm.errors.takenDown',
        }),
      )
    })

    it('should allow a submission when the expiry is still in the future', async () => {
      const next = jest.fn()
      const ctx = createMockContext({
        status: FormStatus.Public,
        closeAt: new Date(Date.now() + 60 * 60 * 1000),
      } as unknown as Partial<IPopulatedForm>)

      await ensurePublicForm(ctx as never, next)

      expect(next).toHaveBeenCalled()
      expect(ctx.res.status).not.toHaveBeenCalled()
    })

    it('should allow a submission when no expiry is set', async () => {
      const next = jest.fn()
      const ctx = createMockContext({
        status: FormStatus.Public,
        closeAt: null,
      } as unknown as Partial<IPopulatedForm>)

      await ensurePublicForm(ctx as never, next)

      expect(next).toHaveBeenCalled()
    })

    it('should reject a submission to a form closed the ordinary way', async () => {
      const next = jest.fn()
      const ctx = createMockContext({ status: FormStatus.Private })

      await ensurePublicForm(ctx as never, next)

      expect(next).not.toHaveBeenCalled()
      expect(ctx.res.status).toHaveBeenCalledWith(404)
    })
  })
})
