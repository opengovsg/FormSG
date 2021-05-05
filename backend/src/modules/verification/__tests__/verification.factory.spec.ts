import { mocked } from 'ts-jest/utils'

import { FeatureNames } from 'config/feature-manager'
import { MissingFeatureError } from '@root/modules/core/core.errors'

import { createVerificationFactory } from '../verification.factory'
import * as VerificationService from '../verification.service'

jest.mock('../verification.service')
const MockVerificationService = mocked(VerificationService, true)

describe('verification.factory', () => {
  it('should return error functions when isEnabled is false', async () => {
    const verificationFactory = createVerificationFactory({
      isEnabled: false,
      props: {
        verificationSecretKey: 'key',
      },
    })

    const error = new MissingFeatureError(FeatureNames.VerifiedFields)

    const createTransactionResult = await verificationFactory.createTransaction(
      '',
    )
    const getTransactionMetadataResult = await verificationFactory.getTransactionMetadata(
      '',
    )
    const resetFieldForTransactionResult = await verificationFactory.resetFieldForTransaction(
      '',
      '',
    )
    const sendNewOtpResult = await verificationFactory.sendNewOtp({
      transactionId: '',
      fieldId: '',
      hashedOtp: '',
      otp: '',
      recipient: '',
    })
    const verifyOtpResult = await verificationFactory.verifyOtp('', '', '')

    expect(createTransactionResult._unsafeUnwrapErr()).toEqual(error)
    expect(getTransactionMetadataResult._unsafeUnwrapErr()).toEqual(error)
    expect(resetFieldForTransactionResult._unsafeUnwrapErr()).toEqual(error)
    expect(sendNewOtpResult._unsafeUnwrapErr()).toEqual(error)
    expect(verifyOtpResult._unsafeUnwrapErr()).toEqual(error)
  })

  it('should return error functions when props is falsy', async () => {
    const verificationFactory = createVerificationFactory({
      isEnabled: true,
      props: undefined,
    })

    const error = new MissingFeatureError(FeatureNames.VerifiedFields)

    const createTransactionResult = await verificationFactory.createTransaction(
      '',
    )
    const getTransactionMetadataResult = await verificationFactory.getTransactionMetadata(
      '',
    )
    const resetFieldForTransactionResult = await verificationFactory.resetFieldForTransaction(
      '',
      '',
    )
    const sendNewOtpResult = await verificationFactory.sendNewOtp({
      transactionId: '',
      fieldId: '',
      hashedOtp: '',
      otp: '',
      recipient: '',
    })
    const verifyOtpResult = await verificationFactory.verifyOtp('', '', '')

    expect(createTransactionResult._unsafeUnwrapErr()).toEqual(error)
    expect(getTransactionMetadataResult._unsafeUnwrapErr()).toEqual(error)
    expect(resetFieldForTransactionResult._unsafeUnwrapErr()).toEqual(error)
    expect(sendNewOtpResult._unsafeUnwrapErr()).toEqual(error)
    expect(verifyOtpResult._unsafeUnwrapErr()).toEqual(error)
  })

  it('should return verification service when isEnabled is true and props are defined', async () => {
    const verificationFactory = createVerificationFactory({
      isEnabled: true,
      props: {
        verificationSecretKey: 'key',
      },
    })

    // Return values not important, check that service functions are called
    await verificationFactory.createTransaction('')
    await verificationFactory.getTransactionMetadata('')
    await verificationFactory.resetFieldForTransaction('', '')
    await verificationFactory.sendNewOtp({
      transactionId: '',
      fieldId: '',
      hashedOtp: '',
      otp: '',
      recipient: '',
    })
    await verificationFactory.verifyOtp('', '', '')

    expect(MockVerificationService.createTransaction).toHaveBeenCalled()
    expect(MockVerificationService.getTransactionMetadata).toHaveBeenCalled()
    expect(MockVerificationService.resetFieldForTransaction).toHaveBeenCalled()
    expect(MockVerificationService.sendNewOtp).toHaveBeenCalled()
    expect(MockVerificationService.verifyOtp).toHaveBeenCalled()
  })
})
