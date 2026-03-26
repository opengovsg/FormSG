/**
 * DO NOT MODIFY THE DATA BELOW.
 *
 * The below data represents a submission from 2020-03-22.
 * It must remain unmodified to maintain strict backwards compatibility.
 *
 * If changes are necessary, create new test data instead.
 */

const plaintext = [
  {
    _id: '5e7479c786eaf2002488a211',
    question: 'Header',
    fieldType: 'section',
    isHeader: true,
    answer: '',
  },
  {
    _id: '5e7479a086eaf2002488a20e',
    question: 'Email',
    fieldType: 'email',
    answer: 'test@open.gov.sg',
  },
  {
    _id: '5e771c246b3c5100240368d8',
    question: 'Mobile Number',
    fieldType: 'mobile',
    answer: '+6598765432',
  },
  {
    _id: '5e7479a386eaf2002488a20f',
    question: 'Number',
    fieldType: 'number',
    answer: '123',
  },
  {
    _id: '5e771c346b3c5100240368da',
    question: 'Decimal',
    fieldType: 'decimal',
    answer: '0.123',
  },
  {
    _id: '5e771c516b3c5100240368dc',
    question: 'Short Text',
    fieldType: 'textfield',
    answer: 'Test',
  },
  {
    _id: '5e771c596b3c5100240368dd',
    question: 'Long Text',
    fieldType: 'textarea',
    answer: 'Long\nText',
  },
  {
    _id: '5e771c626b3c5100240368de',
    question: 'Dropdown',
    fieldType: 'dropdown',
    answer: 'Option 1',
  },
  {
    _id: '5e771c666b3c5100240368df',
    question: 'Yes/No',
    fieldType: 'yes_no',
    answer: 'Yes',
  },
  {
    _id: '5e771c7a6b3c5100240368e0',
    question: 'Checkbox',
    fieldType: 'checkbox',
    answerArray: ['Option 2'],
  },
  {
    _id: '5e771c8a6b3c5100240368e1',
    question: 'Radio',
    fieldType: 'radiobutton',
    answer: 'Option 1',
  },
  {
    _id: '5e771c8d6b3c5100240368e2',
    question: 'Date',
    fieldType: 'date',
    answer: '22 Mar 2020',
  },
  {
    _id: '5e771c906b3c5100240368e3',
    question: 'Rating',
    fieldType: 'rating',
    answer: '5',
  },
  {
    _id: '5e771c946b3c5100240368e4',
    question: 'NRIC',
    fieldType: 'nric',
    answer: 'S9912345A',
  },
]

const ciphertext =
  'RqOjwNXwiVJqvdTrQeD/NiktpI8vzo6CXlBBNihmmwI=;+0cGJwOA42F7DmQO7Kr6tNn9YH/7poDe:2jpehB9uW+63G1EimxOs1tsfR54xxSVZQbFMQaCa8ovVoF/6isBCEl5WLmrE1CRa2c5L2G5rAgCUnhsxQ7jVa//XEKr/m9kGNMbPnVqH62RslAxh30Mzz2he/ssbMazLDBzgQwd8I+pHnrBHQW5BsLqclj7QAMX3fa10Zon0ih4irWQ1o9eYitFllitD+vIcwbBzJyigGvD/t14+2/5imZmJdmJTJXd1ySxDo1X6KjBmph4rzvWtZSUgF7rRfMtAmbyOj87i6CkkNNIN4Dtl3zEuSeLuU2IDF7IHDdAwpmgWM9ejFpwrMFfr8PRovCubuRxCDQ1hV6GOyh60SlKA3oHQMhRQ2yia2vr9yxzHgO+wVUfgoiXQn8tvXFwZmzZd/eWENC1QI+XvP1jt50RIhQ0kMbyhBiaAG9nYlhGO3UHtmGGBoOdW4l4DZaWKRItnw1qgb2oxCvxOIkWNoafq1qJbYJsldOy6a/I2lbwAPL7MzVfgHJDj11dLOBgHGZHia6ZaROXYEiFpkVP8APOO/tgV902nOOlt+w63QNIieCIoGphn9LvOTo6Y6HD8qH6sekEyXCds6jP4RVw5XIN9LGeOWlEKx/VR2rf8b9qzFcYRPzfH5M8I9rpuZkk72ANiTeLRM8C8zWFnitzDlh1B2M+jnjrg+jEYm0ugro7tvHYSmU4tKcGR3mPlDrROjtFf3eBO8+pZKzuQfdA/7kN5YekAzyNjLcixioycrDmjR+BbBKxVrwNlm0hmHLLdU1g42GYpmfUUythDnqwALAOtaZcuj1ObX50h6kmhIl4fAEcXdLKKpoASzafbHnIH0iNX1CefnflLxymDPjjTFqcGSpY1vZf2pxDxUNZPXsd3vbV4KbrYq9v/R5NJ+mW3lxm839aN0pNsMbMetyZTyX8tXofWERxKEZDDXRCoYS0Ijml5h0X58juM13hNtc48iuPyx8oBIy4WophJ+M4CJfsq1wfBK0q+a8P2Tj8odJRQbbFdCoQRRRKbFhk0nT/R3V23cRjMB/Z1DCFmo8ywhUfSlMhrs8f6f3myhmJpzP5MXPJgzRIAytYtUF34j+9fspaYtyQHg4j4f8OBIYrNOCgt6++1bmy0+aI3Y0DoBJ1eLfe9iHUt64cvPbPqmAxX8Jkb1kY+OVwjx7DTxFc5dCzkL/3VA1FAZe7IqfP0v/3fTT6oK7nuy951GUSU9sBynV8Z6zJecYUWbgFZ1u/K8ag6btR2IeRFz7dG+Ffkb8nsGTcNm0l54Q/XbudtfIPN2GTGp1PlgFZ5JERszVrQ8MIrMnHtPvnbtIlqdVzZ0KwR1YQnqtjCoNnI/TzniRZnydE/qJCc5ZwAQDJhl0XRmVes5sp4obxhreSdgGjoyybeFN70rb6uMvsuBlTS5Z6xg7q4eW0e8Xx0PlKYJi8eUsFtzQlN3iJzgFTeLGOlguK2GWnI/Myy5/nan2Np5+eZ2GZhdn6s/NYmiJGLlcbmcXRLOj53O1Z9Oornc+Hq5rz+eZKg4uYNbyFCbvJ9d/wNbRaQva9kETeEfGVosZXotnA2dxYRF4A24Qwjo+yNeRlbyQBf0V0BWY+rfJ+F2JMP4LZ5FNVhd5JI16z7PEgqvlGqm7zkfPmwlTjCzDFXYz749fz9hrzqOCALguEhmMYEsun8mK7IptW77qbKyx2jTu/2OC6pqdWhHB3PliKZXD5EgedpqzHcWQg/s9TloSXy9pE9PEs0j+el+j4yXyQcfrAjODWHSrUXNWSJc1rOM1ochIYJWYHn4pf2Jxuop90+c4DFYp5eih3k8BGy4Etp6L0N7PJ+ugSqZV8L0QYT2sLBwG2cS8FNUGJPoUkUn6R2Bg7bTQ=='

const formSecretKey = 'H7B0nKJ+E7+naSkQApxGayz1y/lZe4thta4iPp1B+Ns='
const formPublicKey = 'NKHcx/SuUfBxhXe20yoVTCsDwQTSfrd5MMClCOrd/js='
const submissionSecretKey = '9h1ys0ZpcPD9pBShwtE4YKXv8882ldjd9sF51YS3Fks='
const submissionPublicKey = 'RqOjwNXwiVJqvdTrQeD/NiktpI8vzo6CXlBBNihmmwI='

export {
  plaintext,
  ciphertext,
  formSecretKey,
  formPublicKey,
  submissionSecretKey,
  submissionPublicKey,
}
