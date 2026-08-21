import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import { FormResponseMode, FormStatus } from 'formsg-shared/types'
import mongoose from 'mongoose'

import getFormModel from 'src/app/models/form.server.model'

import { DatabaseError } from '../../core/core.errors'
import * as FormService from '../form.service'

const Form = getFormModel(mongoose)

const MOCK_ADMIN_OBJ_ID = new ObjectId()

const NOW = new Date('2026-08-20T12:00:00.000Z')
const AN_HOUR_AGO = new Date('2026-08-20T11:00:00.000Z')
const IN_AN_HOUR = new Date('2026-08-20T13:00:00.000Z')

const createForm = async ({
  title,
  status,
  closeAt,
}: {
  title: string
  status: FormStatus
  closeAt: Date | null
}) =>
  Form.create({
    title,
    admin: MOCK_ADMIN_OBJ_ID,
    responseMode: FormResponseMode.Email,
    emails: ['test@example.com'],
    status,
    closeAt,
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
      { formId: String(form._id), title: 'expired', closeAt: AN_HOUR_AGO },
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
            limit: () => ({
              lean: () => ({
                exec: () => Promise.reject(new Error('boom')),
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
