import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Section,
  Text,
} from '@react-email/components'
import { FORMSG_LOGO_URL } from '../../constants/formsg-logo'

import {
  bodyTextStyle,
  containerStyle,
  headingTextStyle,
  mainStyle,
  sectionStyle,
  titleTextStyle,
} from './styles'

export type QuestionAnswer = {
  question: string, 
  answer: string 
}

export type WorkflowEmailData = {
  formTitle: string
  responseId: string
  formQuestionAnswers: QuestionAnswer[]
}

export const MrfWorkflowCompletionEmail = ({
  // Defaults are provided only for testing purposes in react-email-preview.
  formTitle = 'Test form title',
  responseId = '64303c45828035f732088a41', 
  formQuestionAnswers = []
}: WorkflowEmailData): JSX.Element => {
  return (
    <Html>
      <Head /> 
      <Body style={mainStyle}>
          <Container style={containerStyle}>
            <Section style={sectionStyle}>
              <Img style={{height: '1.5rem', marginBottom: '2.5rem'}} src={FORMSG_LOGO_URL} alt="FormSG" />
              <Heading style={headingTextStyle}>
                {formTitle} has been completed by all respondents.
              </Heading>
              <Hr style={{marginTop: '2.5rem', marginBottom: '2.5rem'}}/>
              <Heading style={{...headingTextStyle, marginBottom: '2.5rem'}}>
                Responses for {formTitle} 
              </Heading>
              <Text style={{...titleTextStyle, marginBottom: '0.25rem'}}>Response ID</Text>
              <Text style={{...bodyTextStyle, marginTop: '0.25rem'}}>{responseId}</Text>
              { 
                formQuestionAnswers.map((qa) => {
                return <>
                  <Text style={{...titleTextStyle, marginBottom: '0.25rem'}}>{qa.question}</Text>
                  <Text style={{...bodyTextStyle, marginTop: '0.25rem'}}>{qa.answer}</Text>
                </>})
              }
              <Text style={{...bodyTextStyle, paddingTop: '2.5rem'}}> 
                For more details, please contact the respondent(s) or form administrator. 
              </Text>
            </Section> 
          </Container>
      </Body>
    </Html>
  )
}

export default MrfWorkflowCompletionEmail
