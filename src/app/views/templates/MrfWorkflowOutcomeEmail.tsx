import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Row,
  Text,
} from '@react-email/components'
import { FORMSG_LOGO_URL } from '../../constants/formsg-logo'

import {
  headingStyle,
  innerContainerStyle,
  outerContainerStyle,
  textStyle,
} from './styles'

export enum WorkflowOutcome {
  APPROVED = 'Approved', 
  NOT_APPROVED = 'Not approved' 
}  

export type WorkflowOutcomeEmailData = {
  formTitle: string
  responseId: string
  outcome: WorkflowOutcome 
}

export const MrfWorkflowOutcomeEmail = ({
  // Defaults are provided only for testing purposes in react-email-preview.
  outcome = WorkflowOutcome.APPROVED, 
  formTitle = 'Test form title',
  responseId = '64303c45828035f732088a41'
}: WorkflowOutcomeEmailData): JSX.Element => {
  return (
    <Html>
      <Head />
      <Body style={outerContainerStyle}>
        <Container style={innerContainerStyle}>
          <Row>
            <Column>
              <Img src={FORMSG_LOGO_URL} alt="FormSG" />
            </Column>
          </Row>
          <Row style={{ paddingTop: '16px' }}>
            <Column>
              <Heading style={headingStyle}>
                The outcome for {formTitle}.
              </Heading>
            </Column>
          </Row>
          <Row style={{ paddingTop: '16px' }}>
            <Column>
              <Text style={textStyle}>Outcome</Text>
            </Column>
            <Column style={textStyle}>
              <Text>{outcome}</Text>
            </Column>
          </Row>
          <Row style={{ paddingTop: '16px' }}>
            <Column>
              <Text style={textStyle}>Response ID</Text>
            </Column>
            <Column style={textStyle}>
              <Text>{responseId}</Text>
            </Column>
          </Row>
          <Row style={{ paddingTop: '32px' }}>
            <Column>
              <Hr />
            </Column>
          </Row>
          <Row>
            <Column>
              <Text style={{ ...textStyle, fontSize: '14px' }}>
                For more details, please contact the respondent(s) or form administrator. 
              </Text>
            </Column>
          </Row>
        </Container>
      </Body>
    </Html>
  )
}

export default MrfWorkflowOutcomeEmail
