import { flatten, times } from 'lodash'
import mongoose from 'mongoose'

import getFormModel from 'src/app/models/form.server.model'
import getFormFeedbackModel from 'src/app/models/form_feedback.server.model'
import getFormStatisticsTotalModel from 'src/app/models/form_statistics_total.server.model'
import getSubmissionModel from 'src/app/models/submission.server.model'
import {
  IAgencySchema,
  IFormDocument,
  IFormFeedbackSchema,
  ISubmissionSchema,
  IUserSchema,
} from 'src/types'

import {
  FormAuthType,
  FormResponseMode,
  FormStatus,
  SubmissionType,
} from '../../../../../../shared/types'
import { FormInfo } from '../../examples.types'

const FormStatsModel = getFormStatisticsTotalModel(mongoose)
const SubmissionModel = getSubmissionModel(mongoose)
const FormModel = getFormModel(mongoose)
const FeedbackModel = getFormFeedbackModel(mongoose)

export enum SearchTerm {
  First = 'first',
  Second = 'second',
}

export type TestData = {
  [section: string]: {
    searchTerm: string
    // Number of forms with title containing key.
    formCount: number
    // Number of times the form was submitted.
    submissionCount: number
    // The forms themselves.
    forms: IFormDocument[]
    // Expected form info to be returned by query.
    expectedFormInfo: FormInfo[]
    // Feedbacks for each of the forms.
    feedbacks: IFormFeedbackSchema[]
    // Submissions for each of the forms.
    submissions: ISubmissionSchema[]
  }
}

/**
 * Populates test data such as creating forms, adding submissions and feedback
 * to those created forms, and returning the expected data.
 * @param user The user to create forms for
 * @param agency The agency of the user
 */
const prepareTestData = async (
  user: IUserSchema,
  agency: IAgencySchema,
): Promise<TestData> => {
  const testData: TestData = {
    first: {
      searchTerm: SearchTerm.First,
      formCount: 2,
      submissionCount: 3,
      forms: [],
      expectedFormInfo: [],
      feedbacks: [],
      submissions: [],
    },
    second: {
      searchTerm: SearchTerm.Second,
      formCount: 3,
      submissionCount: 5,
      forms: [],
      expectedFormInfo: [],
      feedbacks: [],
      submissions: [],
    },
    total: {
      searchTerm: '',
      formCount: 5,
      submissionCount: 8,
      forms: [],
      expectedFormInfo: [],
      feedbacks: [],
      submissions: [],
    },
  }

  const baseFormParams = {
    admin: user._id,
    responseMode: FormResponseMode.Email,
    emails: [user.email],
    // Important for form status to be public and listed so examples can
    // surface.
    status: FormStatus.Public,
    isListed: true,
    authType: FormAuthType.NIL,
  }

  // Populate forms in database with prespecified number of times.
  const firstFormsPromises = times(testData.first.formCount, () =>
    FormModel.create({
      ...baseFormParams,
      title: `${testData.first.searchTerm} ${Math.random()}`,
    }),
  ) as Promise<IFormDocument>[]

  testData.first.forms = await Promise.all(firstFormsPromises)

  const secondFormsPromises = times(testData.second.formCount, () =>
    FormModel.create({
      ...baseFormParams,
      title: `${testData.second.searchTerm} ${Math.random()}`,
    }),
  ) as Promise<IFormDocument>[]

  testData.second.forms = await Promise.all(secondFormsPromises)

  // Add submissions to all forms with the prespecified number of submissions.
  const firstSubmissionPromises = flatten(
    testData.first.forms.map((form) =>
      times(testData.first.submissionCount, () =>
        SubmissionModel.create({
          form: form._id,
          submissionType: SubmissionType.Email,
          responseSalt: 'some salt',
          responseHash: 'some hash',
        }),
      ),
    ),
  )
  testData.first.submissions = await Promise.all(firstSubmissionPromises)

  const secondSubmissionPromises = flatten(
    testData.second.forms.map((form) =>
      times(testData.second.submissionCount, () =>
        SubmissionModel.create({
          form: form._id,
          submissionType: SubmissionType.Email,
          responseSalt: 'some salt',
          responseHash: 'some hash',
        }),
      ),
    ),
  )
  testData.second.submissions = await Promise.all(secondSubmissionPromises)

  // Assign all forms in test data.
  testData.total.forms = testData.first.forms.concat(testData.second.forms)

  testData.total.submissions = testData.first.submissions.concat(
    testData.second.submissions,
  )

  // Add form statistics for "submissions" for both form prefixes.
  const formStatsPromises = testData.first.forms
    .map((form) =>
      // Using mongodb native function to bypass collection presave hook.
      FormStatsModel.collection.insertOne({
        lastSubmission: new Date(),
        totalCount: testData.first.submissionCount,
        formId: form._id,
      }),
    )
    .concat(
      testData.second.forms.map((form) =>
        FormStatsModel.collection.insertOne({
          lastSubmission: new Date(),
          totalCount: testData.second.submissionCount,
          formId: form._id,
        }),
      ),
    )

  // Function to generate random number between min and max.
  const randomNumber = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min

  // Generate random feedback scores for all forms.
  const feedbackScores = times(testData.total.forms.length, () =>
    randomNumber(1, 5),
  )

  // Populate feedback collection with generated feedback scores.
  const feedbackPromises = feedbackScores.map((score, i) => {
    return FeedbackModel.create({
      rating: score,
      formId: testData.total.forms[i]._id,
      submissionId: testData.total.submissions[i]._id,
      comment: 'very good test',
    })
  })

  await Promise.all(firstSubmissionPromises.concat(secondSubmissionPromises))
  await Promise.all(formStatsPromises)
  const feedbacks = await Promise.all(feedbackPromises)

  // Assign all feedbacks into test data.
  testData.total.feedbacks = feedbacks
  testData.first.feedbacks = feedbacks.slice(0, testData.first.forms.length + 1)
  testData.second.feedbacks = feedbacks.slice(testData.first.forms.length)

  // Internal function to create expected aggregate pipeline results to insert
  // into test data.
  const createFormInfo = (
    forms: IFormDocument[],
    titlePrefix: 'first' | 'second',
  ): FormInfo[] => {
    const isFirst = titlePrefix === 'first'
    return forms.map((form, i) => ({
      _id: form._id,
      agency: agency.shortName,
      avgFeedback: isFirst
        ? testData.first.feedbacks[i].rating
        : testData.second.feedbacks[i].rating,
      colorTheme: form.startPage.colorTheme,
      count: isFirst
        ? testData.first.submissionCount
        : testData.second.submissionCount,
      form_fields: [],
      logo: agency.logo,
      timeText: 'less than 1 day ago',
      lastSubmission: expect.anything(),
      title: form.title,
      authType: form.authType,
    }))
  }

  // Create expected results from running example aggregate pipelines.
  testData.first.expectedFormInfo = createFormInfo(
    testData.first.forms,
    'first',
  )
  testData.second.expectedFormInfo = createFormInfo(
    testData.second.forms,
    'second',
  )

  testData.total.expectedFormInfo = testData.first.expectedFormInfo.concat(
    testData.second.expectedFormInfo,
  )

  return testData
}

export default prepareTestData
