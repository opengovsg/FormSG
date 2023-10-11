import { BiLink } from 'react-icons/bi'
import { Box, chakra, Flex, Icon, Stack, Text } from '@chakra-ui/react'

import { ReactComponent as BrandMarkSvg } from '~assets/svgs/brand/brand-mark-colour.svg'
import { ReactComponent as GoGovSvg } from '~assets/svgs/brand/go-gov.svg'
import { useMdComponents } from '~hooks/useMdComponents'
import { MarkdownText } from '~components/MarkdownText'

import { BaseFieldProps } from '../FieldContainer'
import { LinkFieldSchema } from '../types'

export interface LinkFieldProps extends BaseFieldProps {
  schema: LinkFieldSchema
}

const FORMSG_REGEX = new RegExp(/form\.gov\.sg/)
const GOGOV_REGEX = new RegExp(/go\.gov\.sg/)
const LOCALHOST_REGEX = new RegExp(/localhost/)

const getUrlIcon = (url: string) => {
  try {
    const { hostname } = new URL(url)
    if (FORMSG_REGEX.test(hostname) || LOCALHOST_REGEX.test(hostname)) {
      return chakra(BrandMarkSvg)
    }
    if (GOGOV_REGEX.test(hostname)) {
      return chakra(GoGovSvg)
    }
    return BiLink
  } catch (err) {
    return BiLink
  }
}

/**
 * Renderer for a link field.
 */
export const LinkField = ({ schema }: LinkFieldProps): JSX.Element => {
  const mdComponents = useMdComponents({
    styles: {
      text: {
        textStyle: 'body-2',
        color: 'secondary.500',
      },
    },
  })

  const linkIcon = getUrlIcon(schema.url)

  return (
    <Stack
      direction="row"
      borderColor="gray.200"
      borderWidth="1px"
      borderRadius="0.5rem"
      padding="1rem"
      onClick={() => window.open(schema.url, '_blank')}
      cursor="pointer"
      wordBreak="break-word"
    >
      <Flex
        borderColor="gray.400"
        borderWidth="1px"
        borderRadius="0.25rem"
        padding="1rem"
        align="center"
        justify="center"
        boxSize="4rem"
        flexShrink={0}
      >
        <Icon as={linkIcon} height="1.5rem" width="1.5rem" />
      </Flex>
      <Box paddingLeft="1rem">
        <Text textStyle="subhead-2" color="content.strong">
          {schema.title || schema.url}
        </Text>
        <Box marginTop="0.375rem">{schema.description}</Box>
      </Box>
    </Stack>
  )
}

export default LinkField
