import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Text,
} from '@react-email/components'
import { FORMSG_LOGO_URL } from '../../constants/formsg-logo'

import {
  buttonStyle,
  headingStyle,
  innerButtonTextStyle,
  innerContainerStyle,
  linkStyle,
  outerContainerStyle,
  textStyle,
} from './styles'

export type WorkflowEmailData = {
  formTitle: string
  responseId: string
  responseUrl: string
}

export const MrfWorkflowEmail = ({
  formTitle = 'Test form title',
  responseId = '64303c45828035f732088a41',
  responseUrl = 'https://form.gov.sg/6b8391fe9810da639463b61c/edit/6481ae09183785bf30b2d5ca?key=Qks08afjek3leF8d83j2nCd902rf=',
}: WorkflowEmailData): JSX.Element => {
  return (
    <Html>
      <Head />
      <Body style={outerContainerStyle}>
        <Container style={innerContainerStyle}>
          <Img
            src={FORMSG_LOGO_URL}
            alt="FormSG"
            width="120px"
            style={{ marginBottom: '36px' }}
          />
          <Heading style={{ ...headingStyle, marginBottom: '36px' }}>
            Review and complete your part of {formTitle}.
          </Heading>
          <Container style={{ marginBottom: '36px' }}>
            <Text
              style={{ ...textStyle, display: 'inline', marginRight: '16px' }}
            >
              Response ID
            </Text>
            <Text style={{ ...textStyle, display: 'inline' }}>
              {responseId}
            </Text>
          </Container>
          <a href={responseUrl} style={buttonStyle}>
            <div style={innerButtonTextStyle}>Review and complete</div>
          </a>
          <Hr style={{ margin: '36px 0' }} />
          <Text style={{ ...textStyle, fontSize: '14px' }}>
            If you are having trouble with the button above, copy and paste the
            link below into your browser:
          </Text>
          <Link href={responseUrl} style={{ ...linkStyle, fontSize: '14px' }}>
            {responseUrl}
          </Link>
        </Container>
      </Body>
    </Html>
  )
}

export default MrfWorkflowEmail
