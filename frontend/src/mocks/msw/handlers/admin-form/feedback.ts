import { rest } from 'msw'

import { FormFeedbackMetaDto } from '~shared/types'

const generateFormFeedbackMeta = (): FormFeedbackMetaDto => {
  return {
    count: 2,
    average: '4.0',
    feedback: [
      {
        rating: 5,
        comment: 'This is a test comment with rating 5',
        date: '1 Apr 2021',
        dateShort: '1 Apr',
        index: 1,
        timestamp: 1586291200000,
      },
      {
        rating: 3,
        comment: 'This is a test comment with rating 3',
        // date: moment(fb.created).tz('Asia/Singapore').format('D MMM YYYY'),
        // dateShort: moment(fb.created).tz('Asia/Singapore').format('D MMM'),
        date: '1 Apr 2021',
        dateShort: '1 Apr',
        index: 2,
        timestamp: 1586291200010,
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
