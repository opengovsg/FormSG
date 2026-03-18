/**
 * DO NOT MODIFY THE DATA BELOW.
 *
 * The below data represents a submission from 2023-12-07.
 * It must remain unmodified to maintain strict backwards compatibility.
 *
 * If changes are necessary, create new test data instead.
 */

const plaintext = {
  '5e7479a086eaf2002488a20e': {
    fieldType: 'email',
    answer: 'test@open.gov.sg',
  },
  '5e771c246b3c5100240368d8': {
    fieldType: 'mobile',
    answer: '+6598765432',
  },
  '5e7479a386eaf2002488a20f': {
    fieldType: 'number',
    answer: '123',
  },
  '5e771c8a6b3c5100240368e1': {
    fieldType: 'radiobutton',
    answer: { value: 'Option 1' },
  },
  '5e771c7a6b3c5100240368e0': {
    fieldType: 'checkbox',
    answer: { value: ['Option 2'], othersInput: 'Another answer' },
  }
}

const plainVerifiedText = { 'uinFin (Step 1)': 'S9912370B' }

const ciphertext = {
  encryptedContent:
    'yUW5li4+IA9q2/n3ZS+5+wrXQ8mKGrFJ1KW9Kf/eRzc=;PgZE8+y8rBvssnqLnqjnnqHDW6PngYKK:eIEuOUQjf1YkQIulZ7bCKXIl6wByg644Ulk/LjhefmLzhkVmXbTxBJVKVG6YgV0ZMcG4JPUuQ+WOW+N1/AOyL/8DJqclX74kG6s0DNXIJixkqNZCnfZapulerR9XXKSfwBjpo1nK25KCg32F/ey2HypPcluGV19hWwgj80mlms7Ya7x1X5wcdttlGrzGEnNH2VEPXjzJZHqiV1TWoQGwxSZ753fpkHUkBeKFA1UkMHS5XYnWyYD48JpfpOAz0L2ti6RHQnQLSKUHscYVfAZt5OyUGqPFmhm2ulWdycNVp8HayQrpqeY8cdu8QsmZRdNCMfMFLahZCm6xKS+8GUrJWgJr64yaZpkxQS45uPb9zxC+G/u4FZhS/YsrjDTuIIwMGS0+qsNr4075yemFFAQHIpbhWZ9QlYrNq2TAolrVezeAw3AQ/nr4sz60dvqRahcse9x8oMxB7jA55OuxH5uk6PcCIAmEi+njr6Lgbcn2mtPMyk7kGcwjNzCL57b51RxJVi0ZqNXrS0FFepvzCK3IOEqKqrKGGK0qGqF4MFsH2wdq4RFkXjLMZk4u9ZWjIRjc',
  encryptedSubmissionSecretKey:
    'ywWDxb29guAgVK4yhLmLK19UKzLrfLAl65JzPDCVNz8=;/Q3WNg7Dk/tWBmpdUcST39zG16/Nyn8V:p1YqpiwEtOssq3yZUhZC1SgIYJcfJDmVFmgNwKf8D+YEqDzLaq5GShR7hTtTixtp',
}

const formPublicKey = 'ySgusViv6xdSIXELuGOq2L3Obp8xorT0Qilv+G4nHnM='
const formSecretKey = 'Ngx1Kwpe8JXZUof/DCkkVduVmPSN4paqaKj5971Gq5c='
const submissionPublicKey = '8JCuSlyJZ5N684o9TNdZLijtuORTlD/pbXiFwNf7Fhc='
const submissionSecretKey = 'bIyKphcx5hiuBaJ4q5cwnXaFNY9Ofe5NQBqTEzf3zYA='

export {
  plaintext,
  plainVerifiedText,
  ciphertext,
  formPublicKey,
  formSecretKey,
  submissionPublicKey,
  submissionSecretKey
}
