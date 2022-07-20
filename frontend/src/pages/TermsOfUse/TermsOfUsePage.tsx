import { FC } from 'react'
import {
  Box,
  Container,
  Flex,
  ListItem,
  ListItemProps,
  ListProps,
  OrderedList,
  Stack,
  Text,
} from '@chakra-ui/react'

import { AppFooter } from '~/app/AppFooter'
import { AppPublicHeader } from '~/app/AppPublicHeader'

import { OSS_README } from '~constants/externalLinks'
import Link from '~components/Link'

interface tempProps {
  temp?: string
  isNumeric?: boolean
}

const SectionListItem: FC<ListItemProps & tempProps> = ({
  children,
  listStyleType = 'decimal',
}) => (
  <ListItem fontWeight={600} textStyle="h3" listStyleType={listStyleType}>
    {children}
  </ListItem>
)

const SubSectionOrderedList: FC<ListProps> = ({ children, ...props }) => (
  <OrderedList spacing="1.5rem" {...props}>
    {children}
  </OrderedList>
)

const SubSubSectionOrderedList: FC<ListProps> = ({
  children,
  styleType = 'lower-roman',
  ...props
}) => (
  <SubSectionOrderedList
    marginInlineStart="1.5rem"
    styleType={styleType}
    {...props}
  >
    {children}
  </SubSectionOrderedList>
)

const SubSectionListItem: FC<ListItemProps & tempProps> = ({
  children,
  temp,
  isNumeric,
  ...props
}) => (
  <ListItem
    textStyle="body-1"
    {...props}
    _before={{
      counterIncrement: 'section',
      content: `"${temp ? temp : '('}"counters(section, ".", ${
        isNumeric ? 'numeric' : 'lower-alpha'
      })"${temp ? ' ' : ') '}"`,
    }}
    listStyleType="none"
  >
    {children}
  </ListItem>
)
const SectionTitle: FC = ({ children }) => <Text mb="1.5rem">{children}</Text>

export const TermsOfUsePage = (): JSX.Element => {
  return (
    <Flex flexDir="column" bg="primary.100">
      <AppPublicHeader />
      <Container color="secondary.700" maxW="85ch" px="2rem" pb="5rem" flex={1}>
        <Stack spacing="5rem">
          <Box as="section">
            <Text textStyle="h1" as="h1" mb="2.5rem">
              Terms of Use
            </Text>
            <OrderedList spacing="1.5rem" marginInlineStart="1.5rem">
              <SectionListItem>
                <SectionTitle>General</SectionTitle>
                <SubSectionOrderedList style={{ counterReset: 'section' }}>
                  <SubSectionListItem temp="1." isNumeric={true}>
                    These Terms of Use govern your access to and use of our
                    services, including the application (whether as software or
                    as a website or otherwise), its contents, push notifications
                    and all other accompanying materials as identified in the
                    Schedule below (collectively, the "<b>Service</b>").
                  </SubSectionListItem>
                  <SubSectionListItem temp="1." isNumeric={true}>
                    This Service is provided to you by the Government Technology
                    Agency ("<b>GovTech</b>"). GovTech’s office is located at 10
                    Pasir Panjang Road, #10-01, Mapletree Business City,
                    Singapore 117438.
                  </SubSectionListItem>
                  <SubSectionListItem temp="1." isNumeric={true}>
                    By accessing or using any part of this Service, you
                    unconditionally agree and accept to be legally bound by
                    these Terms of Use and any amendments thereto from time to
                    time. GovTech reserves the right to change these Terms of
                    Use at its sole discretion and at any time.{' '}
                    <b>
                      You should read the Terms of Use carefully each time you
                      access or use any part of this Service as such access or
                      use will constitute your agreement to the Terms of Use and
                      any amendments to it.
                    </b>
                  </SubSectionListItem>
                  <SubSectionListItem temp="1." isNumeric={true}>
                    <b>
                      If you do not agree to these Terms of Use, please do not
                      use this Service or any part of this Service.
                    </b>
                  </SubSectionListItem>
                  <SubSectionListItem temp="1." isNumeric={true}>
                    If you are accessing or using the Service for and on behalf
                    of another entity (such as your employer), you warrant and
                    represent that you have the necessary authority to bind such
                    entity to these Terms of Use.
                  </SubSectionListItem>
                </SubSectionOrderedList>
              </SectionListItem>
              <SectionListItem>
                <SectionTitle>Nature of this Service</SectionTitle>
                <Text textStyle="body-1">
                  Please see the Schedule for more information and terms
                  concerning this Service.
                </Text>
              </SectionListItem>
              <SectionListItem>
                <SectionTitle>Licence Terms and Restrictions</SectionTitle>
                <SubSectionOrderedList style={{ counterReset: 'section' }}>
                  <SubSectionListItem temp="3." isNumeric={true}>
                    The Service, including the materials made available on or
                    through the Service, is owned by, licensed to, managed or
                    controlled by GovTech. Please see clause 4 (Third Party
                    Materials) for more information.
                  </SubSectionListItem>
                  <SubSectionListItem temp="3." isNumeric={true}>
                    Subject to these Terms of Use, GovTech grants to you a
                    non-exclusive, revocable, and non-transferable right to
                    access and use the Service for personal or internal purposes
                    only, and only for such use permitted by the functions of
                    the Service and intended by GovTech. You shall not, amongst
                    other things, benchmark, reproduce, modify,
                    reverse-engineer, decompile, adapt, publish, redistribute or
                    sublicense the Service or any part of the Service without
                    the prior written consent of GovTech or the respective third
                    party owners. You also shall not use the Service in
                    violation of any applicable laws or agreements that you have
                    with any third parties. All express or implied rights to the
                    Service not specifically granted herein are expressly
                    reserved to GovTech.
                  </SubSectionListItem>
                  <SubSectionListItem temp="3." isNumeric={true}>
                    GovTech reserves the right to:
                    <SubSubSectionOrderedList
                      style={{ counterReset: 'section' }}
                    >
                      <SubSectionListItem
                        temp="3."
                        mt="1.5rem"
                        isNumeric={true}
                      >
                        Update or modify this Service from time to time;
                      </SubSectionListItem>
                      <SubSectionListItem temp="3." isNumeric={true}>
                        Deny or restrict access to or use of the Service by any
                        particular person without ascribing any reasons
                        whatsoever; and
                      </SubSectionListItem>
                      <SubSectionListItem temp="3." isNumeric={true}>
                        Discontinue or terminate this Service at any time
                        without notice or liability to you whatsoever, whereupon
                        all rights granted to you hereunder shall also terminate
                        forthwith. You shall further upon notice from GovTech
                        return or destroy all copies of the Service or materials
                        therein that you may have been provided with.
                      </SubSectionListItem>
                    </SubSubSectionOrderedList>
                  </SubSectionListItem>
                  <SubSectionListItem temp="3." isNumeric={true}>
                    You will not interfere or attempt to interfere with the
                    proper working of the Service or otherwise do anything that
                    imposes an unreasonable or disproportionately large load on
                    GovTech’s servers.
                  </SubSectionListItem>
                </SubSectionOrderedList>
              </SectionListItem>
              <SectionListItem listStyleType="'3A. '">
                <SectionTitle>Account Access and Security</SectionTitle>
                <SubSectionOrderedList style={{ counterReset: 'section 0' }}>
                  <SubSectionListItem temp="3A." isNumeric={true}>
                    You are solely responsible for maintaining the
                    confidentiality and security of any authentication
                    credentials associated with your use of the Service,
                    including the security of any of your devices which store
                    the authentication credentials.
                  </SubSectionListItem>
                  <SubSectionListItem temp="3A." isNumeric={true}>
                    GovTech shall be entitled, but not obliged, to verify the
                    identity of the person using the Service. Without prejudice
                    to the foregoing, GovTech is not under any duty to verify
                    that any biometric identifier used with the Service, or on
                    your device, belongs to you.
                  </SubSectionListItem>
                  <SubSectionListItem temp="3A." isNumeric={true}>
                    GovTech shall have the sole and absolute discretion to
                    invalidate any authentication credentials at any time, or
                    require you to have to re-authenticate or refresh your
                    authentication credentials at any time, without having to
                    give any reason for the same.
                  </SubSectionListItem>
                  <SubSectionListItem temp="3A." isNumeric={true}>
                    GovTech shall be entitled, but not obliged, to act upon or
                    rely on any instructions, information, transmissions of
                    data, or communications received from the account or use of
                    the Service in relation to your authentication credentials,
                    as if such instructions, information, data or communications
                    were issued by you, whether or not the same was authorized
                    by you.
                  </SubSectionListItem>
                  <SubSectionListItem temp="3A." isNumeric={true}>
                    For the avoidance of doubt, you are solely responsible for
                    any loss of whatever nature arising from unauthorized or
                    unofficial modifications made to your device which permit or
                    escalate privileged access, or remove restrictions to such
                    access, which are not intended by the manufacturer or
                    provider of your device or operating system of your device
                    (e.g., "rooting" or "jailbreaking" your mobile phone).
                  </SubSectionListItem>
                </SubSectionOrderedList>
              </SectionListItem>
              <SectionListItem listStyleType="'4. '">
                <SectionTitle>Third Party Materials</SectionTitle>
                <SubSectionOrderedList style={{ counterReset: 'section 0' }}>
                  <SubSectionListItem temp="4." isNumeric={true}>
                    The Service may require, enable or facilitate access to or
                    use of software or services of a third party ("
                    <b>Third Party</b>
                    "). In such an event, there may be terms of use of the third
                    party software or service (the "<b>Third Party Terms</b>").
                    GovTech may be required under or as a result of the Third
                    Party Terms to notify you of certain terms that apply to you
                    (either directly as an end user, or as a party whose acts or
                    omissions could cause GovTech to breach the Third Party
                    Terms) when you use the Services. An example of Third Party
                    Terms may be open source software terms or standard form
                    terms of the distribution platform from which you obtain any
                    part of the Service (e.g. Google Play Store or Apple App
                    Store terms) which bind GovTech as a developer or user of
                    the distribution platform (the "<b>Distribution Terms</b>").
                    Information on the Third Party Terms are embedded in the
                    Service, already accounted for in these Terms of Use,
                    publicly available (e.g the Distribution Terms) or otherwise
                    listed in the Schedule herein. For the avoidance of doubt,
                    insofar as this Clause 4 relates to the Distribution Terms,
                    the relevant Distribution Terms are the terms of the
                    specific platform from which you obtained a copy of the
                    software or application that is part of the Service. For
                    example, if you obtained the said copy from the Google Play
                    Store, then the relevant terms are Google’s Distribution
                    Terms.
                  </SubSectionListItem>
                  <SubSectionListItem temp="4." isNumeric={true}>
                    <b>
                      It is your responsibility to check and read the most
                      up-to-date versions of these Third Party Terms and you are
                      deemed to have notice of the same.{' '}
                    </b>
                    In particular, you are deemed to have notice of the Third
                    Party Terms that GovTech (under the Third Party Terms) is
                    required to notify you, and you unconditionally agree to be
                    bound by all the obligations in the Third Party Terms which
                    are applicable to you as the end user. For the avoidance of
                    doubt, where Third Party Terms are listed, such Third Party
                    Terms shall be deemed to include any privacy policies and
                    acceptable use policies as are applicable to you.
                  </SubSectionListItem>
                  <SubSectionListItem temp="4." isNumeric={true}>
                    <Text mb="1.5rem">
                      If the Third Party Terms require you to enter into an
                      agreement directly with the Third Party, then you
                      unconditionally agree to enter into such agreement, and in
                      any event, to be legally bound by the Third Party Terms.
                      For the avoidance of doubt:
                    </Text>
                    <SubSubSectionOrderedList
                      style={{ counterReset: 'section 0' }}
                    >
                      <SubSectionListItem temp="4." isNumeric={true}>
                        some Third Party Terms (particularly open-source terms)
                        permit either a direct licence to you from the Third
                        Party or a sublicence from GovTech to you. In such
                        cases, your licence is a direct licence from the Third
                        Party to you; and
                      </SubSectionListItem>
                      <SubSectionListItem temp="4." isNumeric={true}>
                        the terms of your agreement with the Third Party will
                        govern your use of the relevant third party software or
                        service, and not these Terms of Use.
                      </SubSectionListItem>
                    </SubSubSectionOrderedList>
                  </SubSectionListItem>
                  <SubSectionListItem temp="4." isNumeric={true}>
                    If the Third Party Terms expressly or impliedly require
                    GovTech to incorporate certain terms in these Terms of Use
                    (inclusive of terms which impose any minimum or maximum
                    standards herein, and/or terms described in Clause 4.e
                    below), such terms are deemed to have been so incorporated
                    (the "<b>Incorporated Terms</b>"). Examples of Incorporated
                    Terms include provisions which require GovTech to give you
                    notice of certain rights and liabilities or require GovTech
                    to ensure that you acknowledge certain matters. Similarly,
                    if the Third Party Terms expressly or impliedly require
                    these Terms of Use to be altered such that the Third Party
                    Terms are complied with, the parties herein agree that the
                    Terms of Use shall be deemed to be so altered but only to
                    the extent necessary for compliance.
                  </SubSectionListItem>
                  <SubSectionListItem temp="4." isNumeric={true}>
                    Some Third Party Terms grant the Third Party, or require
                    GovTech to grant the Third Party, direct rights of
                    enforcement of these Terms of Use as a third party
                    beneficiary, against you. Such Third Party Terms are deemed
                    to have been incorporated into these Terms of Use as
                    Incorporated Terms, and you hereby agree to grant such Third
                    Party, such direct rights of enforcement against you.
                  </SubSectionListItem>
                  <SubSectionListItem temp="4." isNumeric={true}>
                    For the avoidance of doubt, without prejudice to Clause 4.d,
                    to the extent of any inconsistency between these Terms of
                    Use and the Third Party Terms, the latter shall prevail
                    provided nothing in the Third Party Terms increases the
                    liability of GovTech beyond that stated in Clause 6.
                  </SubSectionListItem>
                  <SubSectionListItem temp="4." isNumeric={true}>
                    Without prejudice and in addition to the foregoing, GovTech
                    shall not be responsible for your use of any software or
                    service of a Third Party.
                  </SubSectionListItem>
                </SubSectionOrderedList>
              </SectionListItem>
              <SectionListItem listStyleType="'5. '">
                <SectionTitle>
                  Your Consent to Access Functions of Your Device
                </SectionTitle>
                <Text textStyle="body-1">
                  Use of the Service may require you to allow access by the
                  Service to certain functions of your device, such as push
                  notifications, the obtaining and/or sharing of your location,
                  or the collection of data from you in connection with the
                  Service. Please also see clause 8 (Privacy Policy). Your use
                  of the Service shall constitute your consent to the access by
                  the Service of such functions of your device as may be
                  reasonably required by the Service.
                </Text>
              </SectionListItem>
              <SectionListItem listStyleType="'5A. '">
                <SectionTitle>
                  Ownership of Feedback/Requests/Suggestions
                </SectionTitle>
                <Text textStyle="body-1">
                  You agree that all title and interest in any feedback,
                  requests or suggestions from you concerning the Services shall
                  be owned by GovTech.
                </Text>
              </SectionListItem>
              <SectionListItem listStyleType="'5B. '">
                <SectionTitle>Confidentiality</SectionTitle>
                <SubSectionOrderedList style={{ counterReset: 'section 0' }}>
                  <SubSectionListItem temp="5B." isNumeric={true}>
                    If you receive information or data (in whatever form) from
                    GovTech or a Third Party which is designated confidential or
                    proprietary or is otherwise reasonably understood to be
                    confidential or proprietary (collectively, "
                    <b>Confidential Information</b>"), you shall not use,
                    disclose or reproduce the Confidential Information except
                    for the purpose for which it was provided to you. If consent
                    to disclose the Confidential Information to a third party is
                    given by GovTech or the Third Party to you, any act or
                    omission in respect of the Confidential Information by that
                    person shall be deemed to be your act or omission and you
                    agree to be fully liable for the same. In all cases, you
                    shall protect the Confidential Information to the same
                    extent you protect your own confidential information but in
                    no event less than a reasonable standard of care. You shall
                    ensure that any recipients are bound by confidentiality
                    terms at least as restrictive as this Clause.
                  </SubSectionListItem>
                  <SubSectionListItem temp="5B." isNumeric={true}>
                    You shall destroy any Confidential Information immediately
                    upon request by GovTech or the Third Party.
                  </SubSectionListItem>
                  <SubSectionListItem temp="5B." isNumeric={true}>
                    In the event:
                    <SubSubSectionOrderedList
                      style={{ counterReset: 'section 0' }}
                      mt="1.5rem"
                    >
                      <SubSectionListItem temp="5B." isNumeric={true}>
                        you are, or likely to be, required by an order of court
                        to disclose Confidential Information; or
                      </SubSectionListItem>
                      <SubSectionListItem temp="5B." isNumeric={true}>
                        you have reasonable grounds to suspect the unauthorised
                        use or disclosure or reproduction of Confidential
                        Information;
                      </SubSectionListItem>
                    </SubSubSectionOrderedList>
                    <Text mt="1.5rem">
                      you shall immediately notify GovTech or the Third Party of
                      the same and cooperate with GovTech or the Third Party to
                      prevent or limit such disclosure.
                    </Text>
                  </SubSectionListItem>
                  <SubSectionListItem temp="5B." isNumeric={true}>
                    Nothing in this Clause 5B shall prejudice GovTech’s or the
                    Third Party’s other rights at law.
                  </SubSectionListItem>
                </SubSectionOrderedList>
              </SectionListItem>
              <SectionListItem listStyleType="'6. '">
                <SectionTitle>Disclaimers and Indemnity</SectionTitle>
                <SubSectionOrderedList style={{ counterReset: 'section 0' }}>
                  <SubSectionListItem temp="6." isNumeric={true}>
                    <b>
                      The Service is provided on an "as is" and "as available"
                      basis without warranties of any kind. To the fullest
                      extent permitted by law, GovTech does not make any
                      representations or warranties of any kind whatsoever in
                      relation to the Service and hereby disclaims all express,
                      implied and/or statutory warranties of any kind to you or
                      any third party, whether arising from usage or custom or
                      trade or by operation of law or otherwise, including but
                      not limited to any representations or warranties:
                    </b>

                    <SubSubSectionOrderedList
                      mt="1.5rem"
                      style={{ counterReset: 'section 0' }}
                    >
                      <SubSectionListItem temp="6." isNumeric={true}>
                        <b>
                          as to the accuracy, completeness, correctness,
                          currency, timeliness, reliability, availability,
                          interoperability, security, non-infringement, title,
                          merchantability, quality or fitness for any particular
                          purpose of the Service; and/or
                        </b>
                      </SubSectionListItem>
                      <SubSectionListItem temp="6." isNumeric={true}>
                        <b>
                          that the Service or any functions associated therewith
                          will be uninterrupted or error-free, or that defects
                          will be corrected or that this Service, website and
                          the server are and will be free of all viruses and/or
                          other malicious, destructive or corrupting code,
                          programme or macro.
                        </b>
                      </SubSectionListItem>
                    </SubSubSectionOrderedList>
                  </SubSectionListItem>
                  <SubSectionListItem temp="6." isNumeric={true}>
                    <b>
                      GovTech shall also not be liable to you or any third party
                      for any damage or loss of any kind whatsoever and
                      howsoever caused, including but not limited to any direct
                      or indirect, special or consequential damages, loss of
                      income, revenue or profits, lost or damaged data, or
                      damage to your computer, software or any other property,
                      whether arising directly or indirectly from –
                    </b>
                    <SubSubSectionOrderedList
                      mt="1.5rem"
                      style={{ counterReset: 'section 0' }}
                    >
                      <SubSectionListItem temp="6." isNumeric={true}>
                        <b>
                          your access to or use of this Service, or any part
                          thereof;
                        </b>
                      </SubSectionListItem>
                      <SubSectionListItem temp="6." isNumeric={true}>
                        <b>
                          any loss of access or use of this Service or any part
                          of this Service, howsoever caused;
                        </b>
                      </SubSectionListItem>
                      <SubSectionListItem temp="6." isNumeric={true}>
                        <b>
                          any inaccuracy or incompleteness in, or errors or
                          omissions in the transmission of, the Service;
                        </b>
                      </SubSectionListItem>
                      <SubSectionListItem temp="6." isNumeric={true}>
                        <b>
                          any delay or interruption in the transmission of the
                          Service, whether caused by delay or interruption in
                          transmission over the internet or otherwise; or
                        </b>
                      </SubSectionListItem>
                      <SubSectionListItem temp="6." isNumeric={true}>
                        <b>
                          any decision made or action taken by you or any third
                          party in reliance upon the Service,
                        </b>
                      </SubSectionListItem>
                    </SubSubSectionOrderedList>
                    <Text fontWeight="bold" mt="1.5rem">
                      regardless of whether GovTech has been advised of the
                      possibility of such damage or loss.
                    </Text>
                  </SubSectionListItem>
                  <SubSectionListItem temp="6." isNumeric={true}>
                    <b>
                      Without prejudice and in addition to the foregoing,
                      insofar as the Service facilitates or requires the
                      provision, use or functioning of, or is provided in
                      conjunction with, other products, software, materials
                      and/or services not provided by GovTech, GovTech makes no
                      representation or warranty in relation to such products,
                      software, materials and/or services (including without
                      limitation any representation or warranties as to
                      timeliness, reliability, availability, interoperability,
                      quality, fitness for purpose, non-infringement,
                      suitability or accuracy).
                    </b>
                  </SubSectionListItem>
                  <SubSectionListItem temp="6." isNumeric={true}>
                    You shall not rely on any part of the Service to claim or
                    assert any form of legitimate expectation against GovTech,
                    whether or not arising out of or in connection with
                    GovTech’s roles and functions as a public authority.
                  </SubSectionListItem>
                  <SubSectionListItem temp="6." isNumeric={true}>
                    You agree to defend and indemnify and keep GovTech and its
                    officers, employees, agents and contractors harmless against
                    all liabilities, losses, damages, costs or expenses
                    (including legal costs on an indemnity basis) howsoever
                    arising out of or in connection with your access or use of
                    the Service (including third party software or services) or
                    your non-compliance with the Terms of Use, Third Party Terms
                    or Incorporated Terms, whether or not you had been advised
                    or informed of the nature or extent of such liabilities,
                    losses, damages, costs or expenses. You warrant and
                    represent that your access or use of the Service does not
                    and will not breach or violate any laws, regulations, trade,
                    economic and/or export sanctions (wherever in the world)
                    applicable to you, and that you shall not transmit any
                    malicious code, illegal, infringing or undesirable content
                    or materials to GovTech or its agents or any Third Party.
                  </SubSectionListItem>
                  <SubSectionListItem temp="6." isNumeric={true}>
                    Without prejudice and in addition to GovTech’s other rights
                    herein:
                    <SubSubSectionOrderedList
                      mt="1.5rem"
                      style={{ counterReset: 'section 0' }}
                    >
                      <SubSectionListItem temp="6." isNumeric={true}>
                        in no event shall GovTech’s total cumulative liability
                        arising out of or in connection with these Terms of Use
                        to you exceed the amount of fees or payment received by
                        GovTech (and not paid or given to any Third Party by
                        GovTech) from you for the Service in the 12 months
                        preceding the date of the first cause of action; and
                      </SubSectionListItem>
                      <SubSectionListItem temp="6." isNumeric={true}>
                        no action may be brought by you against GovTech arising
                        out of or in connection with these Terms of Use more
                        than one (1) year after the cause of action arose.
                      </SubSectionListItem>
                    </SubSubSectionOrderedList>
                  </SubSectionListItem>
                </SubSectionOrderedList>
              </SectionListItem>
              <SectionListItem listStyleType="'7. '">
                <SectionTitle>Hyperlinks</SectionTitle>
                <SubSectionOrderedList style={{ counterReset: 'section 0' }}>
                  <SubSectionListItem temp="7." isNumeric={true}>
                    Insofar as the Service provides a hyperlink to material not
                    maintained or controlled by GovTech, GovTech shall not be
                    responsible for the content of the hyperlinked material and
                    shall not be liable for any damages or loss arising from
                    access to the hyperlinked material. Use of the hyperlinks
                    and access to such hyperlinked materials are entirely at
                    your own risk. The hyperlinks are provided merely as a
                    convenience to you and do not imply endorsement by,
                    association or affiliation with GovTech of the contents of
                    or provider of the hyperlinked materials.
                  </SubSectionListItem>
                  <SubSectionListItem temp="7." isNumeric={true}>
                    Caching and hyperlinking to, and the framing of, any part of
                    the Service is prohibited save where you have obtained
                    GovTech’s prior written consent. Such consent may be subject
                    to any conditions as may be determined by GovTech in its
                    sole discretion. If you hyperlink to or frame any part of
                    the Service, that shall constitute your acceptance of these
                    Terms of Use and all amendments thereto. If you do not
                    accept these Terms of Use as may be amended from time to
                    time, you must immediately discontinue linking to or framing
                    of any part of the Service.
                  </SubSectionListItem>
                  <SubSectionListItem temp="7." isNumeric={true}>
                    GovTech reserves all rights:
                    <SubSubSectionOrderedList
                      style={{ counterReset: 'section 0' }}
                      mt="1.5rem"
                    >
                      <SubSectionListItem temp="7." isNumeric={true}>
                        to disable any links to, or frames of, any materials
                        which are unauthorised (including without limitation
                        materials which imply endorsement by or association or
                        affiliation with GovTech, materials containing
                        inappropriate, profane, defamatory, infringing, obscene,
                        indecent or unlawful topics, names, or information that
                        violates any written law, any applicable intellectual
                        property, proprietary, privacy or publicity rights); and
                      </SubSectionListItem>
                      <SubSectionListItem temp="7." isNumeric={true}>
                        to disclaim responsibility and/or liability for
                        materials that link to or frame any part of the Service.
                      </SubSectionListItem>
                    </SubSubSectionOrderedList>
                  </SubSectionListItem>
                </SubSectionOrderedList>
              </SectionListItem>
              <SectionListItem listStyleType="'8. '">
                <SectionTitle>Privacy Policy</SectionTitle>
                <Text textStyle="body-1">
                  You also agree to the terms of the Privacy Policy for this
                  Service as may be amended from time to time. The Privacy
                  Policy will form part of these Terms of Use.
                </Text>
              </SectionListItem>
              <SectionListItem listStyleType="'9. '">
                <SectionTitle>Rights of Third Parties</SectionTitle>
                <Text textStyle="body-1">
                  Subject to the rights of the Third Party, a person who is not
                  a party to this Terms of Use shall have no right under the
                  Contract (Rights of Third Parties) Act or otherwise to enforce
                  any of its terms.
                </Text>
              </SectionListItem>
              <SectionListItem listStyleType="'10. '">
                <SectionTitle>Assignment</SectionTitle>
                <SubSectionOrderedList style={{ counterReset: 'section 0' }}>
                  <SubSectionListItem temp="10." isNumeric={true}>
                    You may not assign or sub-contract this Terms of Use without
                    the prior written consent of GovTech.
                  </SubSectionListItem>
                  <SubSectionListItem temp="10." isNumeric={true}>
                    GovTech may assign, novate, transfer, or sub-contract the
                    rights and liabilities in respect of the Service and this
                    Terms of Use, without notifying you and without further
                    reference to you. Your acceptance of this Terms of Use shall
                    also constitute your consent to such assignment, novation,
                    transfer or sub-contract.
                  </SubSectionListItem>
                </SubSectionOrderedList>
              </SectionListItem>
              <SectionListItem listStyleType="'10A. '">
                <SectionTitle>Severability</SectionTitle>
                <Text textStyle="body-1">
                  If any term of these Terms of Use is held by a court or
                  tribunal of competent jurisdiction to be invalid or
                  unenforceable, then these Terms of Use, including all of the
                  remaining terms, will remain in full force and effect as if
                  such invalid or unenforceable term had never been included
                  but, to the extent permissible, such invalid or unenforceable
                  terms shall be deemed to have been replaced by terms that are
                  (a) valid and enforceable and (b) express the intention or
                  produce the result closest to the original intention of the
                  invalid or unenforceable terms.
                </Text>
              </SectionListItem>
              <SectionListItem listStyleType="'11. '">
                <SectionTitle>
                  Governing Law and Dispute Resolution
                </SectionTitle>
                <SubSectionOrderedList style={{ counterReset: 'section 0' }}>
                  <SubSectionListItem temp="11." isNumeric={true}>
                    These Terms of Use shall be governed by and construed in
                    accordance with laws of Singapore.
                  </SubSectionListItem>
                  <SubSectionListItem temp="11." isNumeric={true}>
                    Subject to clause 11.c, any dispute arising out of or in
                    connection with these Terms of Use, including any question
                    regarding its existence, validity or termination, shall be
                    referred to and finally resolved in the Courts of the
                    Republic of Singapore and the parties hereby submit to the
                    exclusive jurisdiction of the Courts of the Republic of
                    Singapore.
                  </SubSectionListItem>
                  <SubSectionListItem temp="11." isNumeric={true}>
                    GovTech may, at its sole discretion, refer any dispute
                    referred to in clause 11.b above to arbitration administered
                    by the Singapore International Arbitration Centre ("
                    <b>SIAC</b>") in Singapore in accordance with the
                    Arbitration Rules of the SIAC ("<b>SIAC Rules</b>") for the
                    time being in force, which rules are deemed to be
                    incorporated by reference in this clause. Further:
                    <SubSubSectionOrderedList
                      style={{ counterReset: 'section 0' }}
                      mt="1.5rem"
                    >
                      <SubSectionListItem temp="11." isNumeric={true}>
                        The seat of the arbitration shall be Singapore.
                      </SubSectionListItem>
                      <SubSectionListItem temp="11." isNumeric={true}>
                        The tribunal shall consist of one (1) arbitrator.
                      </SubSectionListItem>
                      <SubSectionListItem temp="11." isNumeric={true}>
                        The language of the arbitration shall be English.
                      </SubSectionListItem>
                      <SubSectionListItem temp="11." isNumeric={true}>
                        All information, pleadings, documents, evidence and all
                        matters relating to the arbitration shall be
                        confidential.
                      </SubSectionListItem>
                    </SubSubSectionOrderedList>
                    <Text mt="1.5rem">
                      Where GovTech is the defendant or respondent, it shall be
                      given at least 30 days before the commencement of any
                      legal action against it to elect to exercise the right
                      herein to have the dispute submitted to arbitration. This
                      right to elect shall not prejudice GovTech’s right to a
                      limitation defence and the period to exercise the right
                      shall not be abridged by reason of any accrual of a
                      limitation defence in favour of GovTech during the said
                      period.
                    </Text>
                  </SubSectionListItem>
                </SubSectionOrderedList>
              </SectionListItem>
            </OrderedList>
            <Text mt="2rem">These Terms of Use are dated 19 Oct 2021.</Text>
          </Box>
          {/* SCHEDULE SCHEDULE SCHEDULE SCHEDULE SCHEDULE SCHEDULE*/}
          <Box as="section">
            <Text textStyle="h1" as="h1" mb="2.5rem">
              Schedule
            </Text>
            <OrderedList spacing="1.5rem" marginInlineStart="1.5rem">
              <SectionListItem>
                <SectionTitle>Name of Service: Form</SectionTitle>
              </SectionListItem>
              <SectionListItem>
                <SectionTitle>Nature of Service</SectionTitle>
                <SubSectionOrderedList style={{ counterReset: 'section' }}>
                  <Text textStyle="body-1" mb="1.5rem" ml="-1.5rem">
                    If you are creating a form, (a) to (e) apply to you:
                  </Text>
                  <SubSectionListItem>
                    Notwithstanding anything in the Terms of Use, the Service is
                    intended for use by a Singapore public sector agency or a
                    healthcare institution that is under the NHG, SingHealth, or
                    NUHS healthcare clusters only. "You" in (a) to (e) refers to
                    such entities.
                  </SubSectionListItem>
                  <SubSectionListItem>
                    This Service is a form builder tool for the permitted
                    entities (listed in sub-paragraph (a) above) to build their
                    own online forms.
                  </SubSectionListItem>
                  <SubSectionListItem>
                    Please note that GovTech may collect, store and/or process
                    data that you collect using the forms created by the
                    Service.
                  </SubSectionListItem>
                  <SubSectionListItem>
                    You are responsible for any issues concerning the forms you
                    create and for replying to and/or dealing with the form
                    respondent or any other person concerning your form,
                    including without limitation the use, linking, or
                    publication of your own privacy policy/statement applying to
                    the form. GovTech is not responsible for your compliance
                    with the applicable rules or laws, or for any failure by you
                    to provide a privacy policy/statement.
                  </SubSectionListItem>
                  <SubSectionListItem>
                    GovTech shall have the right to give your form respondents
                    notice of GovTech’s Terms of Use and Privacy Policy in the
                    forms you create.
                  </SubSectionListItem>
                  <Text textStyle="body-1" mb="1.5rem" ml="-1.5rem">
                    If you are responding to a form, (f) to (h) apply to you:
                  </Text>
                  <SubSectionListItem>
                    The Terms of Use apply to you.
                  </SubSectionListItem>
                  <SubSectionListItem>
                    Please note that GovTech may be collecting data on behalf of
                    the form creator. GovTech’s Privacy Policy will also apply
                    to you.
                  </SubSectionListItem>
                  <SubSectionListItem>
                    GovTech’s Terms of Use and Privacy Policy apply in addition
                    to any terms or privacy policy/statement of the form
                    creator.
                  </SubSectionListItem>
                </SubSectionOrderedList>
              </SectionListItem>
              <SectionListItem>
                <SectionTitle>Third party software/services</SectionTitle>
                <SubSectionOrderedList>
                  <SubSectionListItem>
                    Please see this{' '}
                    <Link href={OSS_README} isExternal>
                      link
                    </Link>{' '}
                    for a list of open source components used in the Service.
                  </SubSectionListItem>
                </SubSectionOrderedList>
              </SectionListItem>
              <SectionListItem>
                <SectionTitle>Special terms/notices</SectionTitle>
                <SubSectionOrderedList>
                  <Text textStyle="body-1">
                    {' '}
                    Certain image(s) or footage (as applicable) are used under
                    license from Shutterstock.com.
                  </Text>
                </SubSectionOrderedList>
              </SectionListItem>
            </OrderedList>
          </Box>
        </Stack>
      </Container>
      <AppFooter />
    </Flex>
  )
}
