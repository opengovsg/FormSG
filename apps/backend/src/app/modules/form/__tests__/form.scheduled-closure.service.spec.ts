import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import { FormResponseMode, FormStatus } from 'formsg-shared/types'
import mongoose from 'mongoose'
import { errAsync, okAsync } from 'neverthrow'

import getFormModel from 'src/app/models/form.server.model'
import MailService from 'src/app/services/mail/mail.service'

import { MailSendError } from '../../../services/mail/mail.errors'
import { DatabaseError } from '../../core/core.errors'
import * as FormService from '../form.service'

jest.mock('src/app/services/mail/mail.service')
const MockMailService = jest.mocked(MailService)

const Form = getFormModel(mongoose)

const MOCK_ADMIN_OBJ_ID = new ObjectId()
// Matches the user seeded by dbHandler.insertFormCollectionReqs.
const MOCK_ADMIN_EMAIL = 'test@test.gov.sg'

const NOW = new Date('2026-08-20T12:00:00.000Z')
const AN_HOUR_AGO = new Date('2026-08-20T11:00:00.000Z')
const IN_AN_HOUR = new Date('2026-08-20T13:00:00.000Z')

const createForm = async ({
  title,
  status,
  closeAt,
  permissionList = [],
}: {
  title: string
  status: FormStatus
  closeAt: Date | null
  permissionList?: { email: string; write: boolean }[]
}) =>
  Form.create({
    title,
    admin: MOCK_ADMIN_OBJ_ID,
    responseMode: FormResponseMode.Email,
    emails: ['test@example.com'],
    status,
    closeAt,
    permissionList,
  })

describe('FormService.closeExpiredForms', () => {
  beforeAll(async () => {
    await dbHandler.connect()
    await dbHandler.insertFormCollectionReqs({ userId: MOCK_ADMIN_OBJ_ID })
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    await Form.deleteMany({})
  })

  afterAll(async () => {
    await dbHandler.clearDatabase()
    await dbHandler.closeDatabase()
  })

  it('should close a public form whose closeAt has passed', async () => {
    const form = await createForm({
      title: 'expired',
      status: FormStatus.Public,
      closeAt: AN_HOUR_AGO,
    })

    const actual = await FormService.closeExpiredForms(NOW)

    expect(actual.isOk()).toEqual(true)
    expect(actual._unsafeUnwrap()).toEqual([
      {
        formId: String(form._id),
        title: 'expired',
        closeAt: AN_HOUR_AGO,
        emailRecipients: [MOCK_ADMIN_EMAIL],
      },
    ])
    await expect(
      Form.findById(form._id).then((f) => f?.status),
    ).resolves.toEqual(FormStatus.Private)
  })

  it('should leave a public form whose closeAt is still in the future', async () => {
    const form = await createForm({
      title: 'not yet due',
      status: FormStatus.Public,
      closeAt: IN_AN_HOUR,
    })

    const actual = await FormService.closeExpiredForms(NOW)

    expect(actual._unsafeUnwrap()).toEqual([])
    await expect(
      Form.findById(form._id).then((f) => f?.status),
    ).resolves.toEqual(FormStatus.Public)
  })

  it('should leave a public form with no closeAt set', async () => {
    const form = await createForm({
      title: 'no schedule',
      status: FormStatus.Public,
      closeAt: null,
    })

    const actual = await FormService.closeExpiredForms(NOW)

    expect(actual._unsafeUnwrap()).toEqual([])
    await expect(
      Form.findById(form._id).then((f) => f?.status),
    ).resolves.toEqual(FormStatus.Public)
  })

  it('should not report an already-private expired form, so notifications are not resent', async () => {
    await createForm({
      title: 'already closed',
      status: FormStatus.Private,
      closeAt: AN_HOUR_AGO,
    })

    const actual = await FormService.closeExpiredForms(NOW)

    expect(actual._unsafeUnwrap()).toEqual([])
  })

  it('should be idempotent across repeated sweeps', async () => {
    await createForm({
      title: 'expired',
      status: FormStatus.Public,
      closeAt: AN_HOUR_AGO,
    })

    const first = await FormService.closeExpiredForms(NOW)
    const second = await FormService.closeExpiredForms(NOW)

    expect(first._unsafeUnwrap()).toHaveLength(1)
    expect(second._unsafeUnwrap()).toEqual([])
  })

  it('should close a form whose closeAt is exactly now', async () => {
    // The deadline is inclusive: 2359 means closed at 2359, not at 2400.
    const form = await createForm({
      title: 'due exactly now',
      status: FormStatus.Public,
      closeAt: NOW,
    })

    const actual = await FormService.closeExpiredForms(NOW)

    expect(actual._unsafeUnwrap()).toHaveLength(1)
    await expect(
      Form.findById(form._id).then((f) => f?.status),
    ).resolves.toEqual(FormStatus.Private)
  })

  it('should close only the expired forms when several forms coexist', async () => {
    const expired = await createForm({
      title: 'expired',
      status: FormStatus.Public,
      closeAt: AN_HOUR_AGO,
    })
    const future = await createForm({
      title: 'future',
      status: FormStatus.Public,
      closeAt: IN_AN_HOUR,
    })
    const unscheduled = await createForm({
      title: 'unscheduled',
      status: FormStatus.Public,
      closeAt: null,
    })

    const actual = await FormService.closeExpiredForms(NOW)

    expect(actual._unsafeUnwrap().map((f) => f.formId)).toEqual([
      String(expired._id),
    ])
    await expect(
      Form.findById(future._id).then((f) => f?.status),
    ).resolves.toEqual(FormStatus.Public)
    await expect(
      Form.findById(unscheduled._id).then((f) => f?.status),
    ).resolves.toEqual(FormStatus.Public)
  })

  it('should return an empty list when there is nothing to close', async () => {
    const actual = await FormService.closeExpiredForms(NOW)

    expect(actual.isOk()).toEqual(true)
    expect(actual._unsafeUnwrap()).toEqual([])
  })

  it('should cap a single sweep at the batch limit', async () => {
    // Passing a small limit rather than seeding 500+ documents, which would
    // make the suite slow for no extra coverage of the cap itself.
    await Promise.all(
      ['expired one', 'expired two', 'expired three'].map((title) =>
        createForm({
          title,
          status: FormStatus.Public,
          closeAt: AN_HOUR_AGO,
        }),
      ),
    )

    const actual = await FormService.closeExpiredForms(NOW, 2)

    expect(actual._unsafeUnwrap()).toHaveLength(2)
    await expect(
      Form.countDocuments({ status: FormStatus.Public }),
    ).resolves.toEqual(1)
  })

  it('should return a DatabaseError when the query fails', async () => {
    jest.spyOn(Form, 'find').mockImplementationOnce(
      () =>
        ({
          select: () => ({
            populate: () => ({
              limit: () => ({
                lean: () => ({
                  exec: () => Promise.reject(new Error('boom')),
                }),
              }),
            }),
          }),
        }) as never,
    )

    const actual = await FormService.closeExpiredForms(NOW)

    expect(actual.isErr()).toEqual(true)
    expect(actual._unsafeUnwrapErr()).toBeInstanceOf(DatabaseError)
  })
})

describe('FormService.closeExpiredForms recipients', () => {
  beforeAll(async () => {
    await dbHandler.connect()
    await dbHandler.insertFormCollectionReqs({ userId: MOCK_ADMIN_OBJ_ID })
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    await Form.deleteMany({})
  })

  afterAll(async () => {
    await dbHandler.clearDatabase()
    await dbHandler.closeDatabase()
  })

  it('should include the admin and every collaborator', async () => {
    await createForm({
      title: 'expired with collaborators',
      status: FormStatus.Public,
      closeAt: AN_HOUR_AGO,
      permissionList: [
        { email: 'editor@test.gov.sg', write: true },
        { email: 'viewer@test.gov.sg', write: false },
      ],
    })

    const actual = await FormService.closeExpiredForms(NOW)

    expect(actual._unsafeUnwrap()[0].emailRecipients).toEqual([
      MOCK_ADMIN_EMAIL,
      'editor@test.gov.sg',
      'viewer@test.gov.sg',
    ])
  })
})

describe('FormService.notifyFormsClosed', () => {
  const closedForm = {
    formId: String(new ObjectId()),
    title: 'expired form',
    closeAt: AN_HOUR_AGO,
    emailRecipients: ['admin@test.gov.sg'],
  }

  afterEach(() => jest.clearAllMocks())

  it('should send one notification per closed form', async () => {
    MockMailService.sendFormScheduledClosureNotification.mockReturnValue(
      okAsync(true),
    )
    const second = { ...closedForm, formId: String(new ObjectId()) }

    const actual = await FormService.notifyFormsClosed([closedForm, second])

    expect(actual._unsafeUnwrap()).toEqual({ sentCount: 2, failedCount: 0 })
    expect(
      MockMailService.sendFormScheduledClosureNotification,
    ).toHaveBeenCalledTimes(2)
  })

  it('should format the close instant in Singapore time', async () => {
    MockMailService.sendFormScheduledClosureNotification.mockReturnValue(
      okAsync(true),
    )

    // 11:00 UTC is 19:00 SGT on the same day.
    await FormService.notifyFormsClosed([closedForm])

    expect(
      MockMailService.sendFormScheduledClosureNotification,
    ).toHaveBeenCalledWith(
      expect.objectContaining({ closedAt: '20 Aug 2026, 7:00 PM (SGT)' }),
    )
  })

  it('should count a failed send without rejecting', async () => {
    MockMailService.sendFormScheduledClosureNotification.mockReturnValue(
      errAsync(new MailSendError('nope')),
    )

    const actual = await FormService.notifyFormsClosed([closedForm])

    expect(actual.isOk()).toEqual(true)
    expect(actual._unsafeUnwrap()).toEqual({ sentCount: 0, failedCount: 1 })
  })

  it('should keep sending to other forms when one fails', async () => {
    MockMailService.sendFormScheduledClosureNotification
      .mockReturnValueOnce(errAsync(new MailSendError('nope')))
      .mockReturnValueOnce(okAsync(true))

    const actual = await FormService.notifyFormsClosed([
      closedForm,
      { ...closedForm, formId: String(new ObjectId()) },
    ])

    expect(actual._unsafeUnwrap()).toEqual({ sentCount: 1, failedCount: 1 })
  })

  it('should skip a form with no recipients rather than send to nobody', async () => {
    const actual = await FormService.notifyFormsClosed([
      { ...closedForm, emailRecipients: [] },
    ])

    expect(actual._unsafeUnwrap()).toEqual({ sentCount: 0, failedCount: 1 })
    expect(
      MockMailService.sendFormScheduledClosureNotification,
    ).not.toHaveBeenCalled()
  })

  it('should do nothing when no forms were closed', async () => {
    const actual = await FormService.notifyFormsClosed([])

    expect(actual._unsafeUnwrap()).toEqual({ sentCount: 0, failedCount: 0 })
    expect(
      MockMailService.sendFormScheduledClosureNotification,
    ).not.toHaveBeenCalled()
  })
})
