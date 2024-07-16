import { FormProvider, useForm } from 'react-hook-form'

import { BasicField } from '~shared/types'

import { AttachmentField, AttachmentFieldSchema } from '~templates/Field'

export const FormWhitelistAttachmentField = (): JSX.Element => {
  const methods = useForm()

  const schema: AttachmentFieldSchema = {
    _id: 'whitelistCsvAttachment',
    title: 'Restrict form to eligible NRIC/FIN/UEN',
    description:
      'Only NRIC/FIN/UENs in this list are allowed to submit a response. CSV file must include a “Respondent” column with all whitelisted NRIC/FIN/UENs. ' +
      '[Download a sample .csv file](https://go.gov.sg/formsg-whitelist-respondents-sample-csv)',
    required: true,
    disabled: false,
    fieldType: BasicField.Attachment,
  }

  return (
    <FormProvider {...methods}>
      <AttachmentField schema={schema} />
    </FormProvider>
  )
}
