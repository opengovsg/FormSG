import {
  BasicField,
  EmailModeSubmissionContentDto,
} from '../../../../shared/types'
import { createEmailSubmissionFormData } from '../submission'

const createMockFile = ({
  name = 'mock.jpg',
  size = 128,
  type = 'image/jpg',
  lastModified = Date.now(),
}: {
  name?: string
  size?: number
  type?: string
  lastModified?: number
} = {}) => {
  const blob = new Blob(['a'.repeat(size)], { type })
  return new File([blob], name, { lastModified })
}

describe('utils/submission', () => {
  describe('createEmailSubmissionFormData', () => {
    const DEFAULT_CONTENT: EmailModeSubmissionContentDto = {
      responses: [
        {
          _id: 'some id',
          question: `field question with answer`,
          answer: `field answer`,
          fieldType: BasicField.ShortText,
        },
        {
          _id: 'another id',
          question: `another question with answerArray`,
          fieldType: BasicField.Checkbox,
          answerArray: ['some answer 1', 'some answer 2'],
        },
      ],
    }
    it('should create FormData successfully when attachments are not provided', async () => {
      // Act
      const actual = createEmailSubmissionFormData({
        content: DEFAULT_CONTENT,
      })

      // Assert
      expect(actual).toBeInstanceOf(FormData)
      expect([...actual.keys()]).toEqual(['body'])
      expect(actual.get('body')).toEqual(JSON.stringify(DEFAULT_CONTENT))
    })

    it('should create FormData successfully when given attachments', async () => {
      // Arrange
      const mockAttachments = {
        someId: createMockFile({ name: 'one attachment' }),
        anotherId: createMockFile({ name: 'another attachment' }),
      }

      // Act
      const actual = createEmailSubmissionFormData({
        content: DEFAULT_CONTENT,
        attachments: mockAttachments,
      })

      // Assert
      expect(actual).toBeInstanceOf(FormData)
      expect([...actual.keys()]).toEqual([
        'body',
        // Should also consist of attachment names as keys
        ...Object.values(mockAttachments).map((a) => a.name),
      ])
      expect(actual.get('body')).toEqual(JSON.stringify(DEFAULT_CONTENT))
      // Can't test blob, trust in FormData.append function.
    })
  })
})
