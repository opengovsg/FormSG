import { ObjectId } from 'bson-ext'
import { pick } from 'lodash'

import {
  AuthType,
  BasicField,
  Colors,
  FormLogoState,
  IFieldSchema,
  IPopulatedForm,
  IPopulatedUser,
  ResponseMode,
  Status,
} from 'src/types'

import { removePrivateDetailsFromForm } from '../form.utils'

const MOCK_POPULATED_FORM = ({
  startPage: {
    colorTheme: Colors.Blue,
    logo: { state: FormLogoState.Default },
    estTimeTaken: 5,
    paragraph: 'For testing.',
  },
  endPage: {
    title: 'Thank you for submitting your declaration.',
    buttonText: 'Submit another form',
    buttonLink: '',
  },
  webhook: { url: '' },
  emails: ['test@example.com'],
  hasCaptcha: true,
  authType: AuthType.NIL,
  status: Status.Private,
  inactiveMessage:
    'If you think this is a mistake, please contact the agency that gave you the form link.',
  isListed: true,
  responseMode: ResponseMode.Email,
  form_fields: [
    {
      title: 'Personal Particulars',
      description: '',
      required: true,
      disabled: false,
      fieldType: BasicField.Section,
      _id: new ObjectId(),
      globalId: '5DXH7jXlJRTBKVGimIMRilyxBfVjMe9myJqon0HzClS',
    } as IFieldSchema,
  ],
  form_logics: [],
  permissionList: [],
  _id: new ObjectId(),
  admin: {
    _id: new ObjectId(),
    email: 'test@example.com',
    __v: 0,
    agency: {
      emailDomain: ['example.com'],
      _id: new ObjectId(),
      lastModified: new Date('2017-09-15T06:03:58.803Z'),
      shortName: 'test',
      fullName: 'Test Agency',
      logo: 'path/to/nowhere',
      created: new Date('2017-09-15T06:03:58.792Z'),
      __v: 0,
    },
    created: new Date('2020-05-14T05:09:40.502Z'),
    lastAccessed: new Date('2020-12-07T15:33:49.079Z'),
    updatedAt: new Date('2020-12-08T02:52:27.637Z'),
  } as IPopulatedUser,
  title: 'test form',
  created: new Date('2020-12-07T15:34:21.426Z'),
  lastModified: new Date('2020-12-07T15:34:21.426Z'),
  __v: 0,
} as unknown) as IPopulatedForm

describe('form.utils', () => {
  describe('removePrivateDetailsFromForm', () => {
    it('should correctly remove private details', async () => {
      // Act
      const actual = removePrivateDetailsFromForm(MOCK_POPULATED_FORM)

      // Assert
      expect(actual).toEqual({
        ...pick(MOCK_POPULATED_FORM, [
          'admin',
          'authType',
          'endPage',
          'esrvcId',
          'form_fields',
          'form_logics',
          'hasCaptcha',
          'publicKey',
          'startPage',
          'status',
          'title',
          '_id',
          'responseMode',
        ]),
        admin: pick(MOCK_POPULATED_FORM.admin, 'agency'),
      })
    })
  })
})
