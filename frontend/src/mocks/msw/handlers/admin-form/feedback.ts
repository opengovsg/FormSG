import { rest } from 'msw'

import { FormFeedbackMetaDto } from '~shared/types'

const generateFormFeedbackMeta = (): FormFeedbackMetaDto => {
  return {
    count: 3,
    average: '4.0',
    feedback: [
      {
        rating: 5,
        comment: 'This is a test comment with rating 5',
        date: '2 Apr 2021',
        dateShort: '2 Apr',
        index: 1,
        timestamp: 1585756800000,
      },
      {
        rating: 3,
        comment: 'This is a test comment with rating 3',
        date: '1 Apr 2021',
        dateShort: '1 Apr',
        index: 2,
        timestamp: 1585670400000,
      },
      {
        rating: 4,
        comment: 'This is a test comment with rating 4',
        date: '1 Apr 2021',
        dateShort: '1 Apr',
        index: 3,
        timestamp: 1585670500000,
      },
    ],
  }
}

export const getAdminFormFeedback = ({
  delay = 0,
}: {
  delay?: number | 'infinite'
} = {}) => {
  return rest.get<FormFeedbackMetaDto>(
    '/api/v3/admin/forms/:formId/feedback',
    (req, res, ctx) => {
      return res(
        ctx.delay(delay),
        ctx.status(200),
        ctx.json(generateFormFeedbackMeta()),
      )
    },
  )
}

export const getEmptyAdminFormFeedback = () => {
  return rest.get<FormFeedbackMetaDto>(
    '/api/v3/admin/forms/:formId/feedback',
    (req, res, ctx) => {
      return res(
        ctx.delay(0),
        ctx.status(200),
        ctx.json<FormFeedbackMetaDto>({
          count: 0,
          feedback: [],
        }),
      )
    },
  )
}
