/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ObjectId } from 'bson-ext'
import mongoose from 'mongoose'
import type { PartialDeep } from 'type-fest'

import getFormModel from 'src/app/models/form.server.model'
import getFormFeedbackModel from 'src/app/models/form_feedback.server.model'
import { DatabaseError } from 'src/app/modules/core/core.errors'
import { IFormSchema } from 'src/types'

import { FormAuthType } from '../../../../../../shared/types'
import { MYINFO_LOGIN_COOKIE_NAME } from '../../../myinfo/myinfo.constants'
import { SGID_COOKIE_NAME } from '../../../sgid/sgid.constants'
import { JwtName } from '../../../spcp/spcp.types'
import { FormNotFoundError } from '../../form.errors'
import * as PublicFormService from '../public-form.service'
import { Metatags } from '../public-form.types'

const FormFeedbackModel = getFormFeedbackModel(mongoose)
const FormModel = getFormModel(mongoose)

describe('public-form.service', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('getCookieNameByAuthType', () => {
    it('should return JwtName[FormAuthType.SP] when authType is SP', () => {
      // Arrange
      const authType = FormAuthType.SP

      // Act
      const result = PublicFormService.getCookieNameByAuthType(authType)

      // Assert
      expect(result).toEqual(JwtName[FormAuthType.SP])
    })

    it('should return JwtName[FormAuthType.CP] when authType is CP', () => {
      // Arrange
      const authType = FormAuthType.CP

      // Act
      const result = PublicFormService.getCookieNameByAuthType(authType)

      // Assert
      expect(result).toEqual(JwtName[FormAuthType.CP])
    })

    it('should return MYINFO_LOGIN_COOKIE_NAME when authType is MyInfo', () => {
      // Arrange
      const authType = FormAuthType.MyInfo

      // Act
      const result = PublicFormService.getCookieNameByAuthType(authType)

      // Assert
      expect(result).toEqual(MYINFO_LOGIN_COOKIE_NAME)
    })

    it('should return SGID_COOKIE_NAME when authType is SGID', () => {
      // Arrange
      const authType = FormAuthType.SGID

      // Act
      const result = PublicFormService.getCookieNameByAuthType(authType)

      // Assert
      expect(result).toEqual(SGID_COOKIE_NAME)
    })
  })

  describe('insertFormFeedback', () => {
    const MOCK_FORM_FEEDBACK = new FormFeedbackModel({
      formId: new ObjectId().toHexString(),
      rating: 5,
      comment: 'Great test',
    })

    it('should return DatabaseError when error occurs whilst inserting feedback', async () => {
      // Arrange
      // Mock failure
      const insertSpy = jest
        .spyOn(FormFeedbackModel, 'create')
        // @ts-ignore
        .mockRejectedValueOnce(new Error('some error'))

      // Act
      const actualResult = await PublicFormService.insertFormFeedback(
        MOCK_FORM_FEEDBACK,
      )

      // Assert
      expect(insertSpy).toHaveBeenCalledTimes(1)
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(DatabaseError)
    })

    it('should return FormNotFoundError when formId is not a valid ObjectId', async () => {
      // Arrange
      const insertSpy = jest.spyOn(FormFeedbackModel, 'create')

      // Act
      const actualResult = await PublicFormService.insertFormFeedback({
        formId: 'not-an-objectId',
        comment: MOCK_FORM_FEEDBACK.comment,
        rating: MOCK_FORM_FEEDBACK.rating,
      })

      // Assert
      expect(insertSpy).not.toHaveBeenCalled()
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(FormNotFoundError)
    })

    it('should return FormFeedback document when feedback is inserted successfully', async () => {
      // Arrange
      // Mock success.
      const insertSpy = jest
        .spyOn(FormFeedbackModel, 'create')
        // @ts-ignore
        .mockResolvedValueOnce(MOCK_FORM_FEEDBACK)

      // Act
      const actualResult = await PublicFormService.insertFormFeedback(
        MOCK_FORM_FEEDBACK,
      )

      // Assert
      expect(insertSpy).toHaveBeenCalledTimes(1)
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(MOCK_FORM_FEEDBACK)
    })
  })

  describe('createMetatags', () => {
    const MOCK_FORM_ID = new ObjectId().toHexString()
    const MOCK_METATAGS_PARAMS: Parameters<
      typeof PublicFormService.createMetatags
    >[0] = {
      formId: MOCK_FORM_ID,
      appUrl: 'some://mock-app.url',
      imageBaseUrl: 'some://image-base-url',
    }

    it('should create metatags successfully', async () => {
      // Arrange
      const mockForm: PartialDeep<IFormSchema> = {
        title: 'mock title',
        _id: MOCK_FORM_ID,
        startPage: {
          paragraph: 'mock form paragraph',
        },
      }

      // Mock form return.
      const findByIdSpy = jest
        .spyOn(FormModel, 'findById')
        // @ts-ignore
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockForm),
        })

      // Act
      const createResult = await PublicFormService.createMetatags(
        MOCK_METATAGS_PARAMS,
      )

      // Assert
      const expectedResults: Metatags = {
        title: mockForm.title || 'impossible',
        description: mockForm.startPage?.paragraph,
        appUrl: MOCK_METATAGS_PARAMS.appUrl,
        images: [
          `${MOCK_METATAGS_PARAMS.imageBaseUrl}/public/modules/core/img/og/img_metatag.png`,
          `${MOCK_METATAGS_PARAMS.imageBaseUrl}/public/modules/core/img/og/logo-vertical-color.png`,
        ],
        twitterImage: `${MOCK_METATAGS_PARAMS.imageBaseUrl}/public/modules/core/img/og/logo-vertical-color.png`,
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(findByIdSpy).toHaveBeenCalledWith(MOCK_FORM_ID)
      expect(createResult.isOk()).toEqual(true)
      expect(createResult._unsafeUnwrap()).toEqual(expectedResults)
    })

    it('should return FormNotFoundError when form cannot be retrieved with given formId', async () => {
      // Arrange
      // Mock null form return.
      const findByIdSpy = jest
        .spyOn(FormModel, 'findById')
        // @ts-ignore
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(null),
        })

      // Act
      const createResult = await PublicFormService.createMetatags(
        MOCK_METATAGS_PARAMS,
      )

      // Assert
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(findByIdSpy).toHaveBeenCalledWith(MOCK_FORM_ID)
      expect(createResult.isErr()).toEqual(true)
      expect(createResult._unsafeUnwrapErr()).toBeInstanceOf(FormNotFoundError)
    })

    it('should return DatabaseError when error occurs whilst querying database', async () => {
      // Arrange
      // Mock failure
      const findByIdSpy = jest
        .spyOn(FormModel, 'findById')
        // @ts-ignore
        .mockReturnValueOnce({
          exec: jest.fn().mockRejectedValue(new Error('some error')),
        })

      // Act
      const createResult = await PublicFormService.createMetatags(
        MOCK_METATAGS_PARAMS,
      )

      // Assert
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(findByIdSpy).toHaveBeenCalledWith(MOCK_FORM_ID)
      expect(createResult.isErr()).toEqual(true)
      expect(createResult._unsafeUnwrapErr()).toBeInstanceOf(DatabaseError)
    })
  })
})
