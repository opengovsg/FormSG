import { FormDto } from '~shared/types/form'

import { EndPageBlock } from './components/EndPageBlock'

export interface FormEndPageProps {
  endPage: FormDto['endPage']
  submissionMeta: {
    formTitle: string
    submissionId: string
    timeInEpochMs: number
  }
}

export const FormEndPage = (props: FormEndPageProps): JSX.Element => {
  return <EndPageBlock {...props} />
}
