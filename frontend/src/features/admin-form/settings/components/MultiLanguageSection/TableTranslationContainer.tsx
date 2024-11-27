import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Divider, Flex, FormControl, Text } from '@chakra-ui/react'

import { Language } from '~shared/types'
import { BasicField } from '~shared/types/field'

import Textarea from '~components/Textarea'

import { TranslationInput } from './TranslationSection'

interface TableColumn {
  title: string
  columnType: BasicField
  fieldOptions?: string[]
  titleTranslations?: { language: string; translation: string }[]
  fieldOptionsTranslations?: { language: string; translation: string[] }[]
}

interface TableTranslationContainerProps {
  language: string
  columns: TableColumn[]
  unicodeLocale: Language
}

export const TableTranslationContainer = ({
  language,
  columns,
  unicodeLocale,
}: TableTranslationContainerProps) => {
  const { register } = useFormContext<TranslationInput>()

  return (
    <>
      {columns.map((column, index) => {
        const previousColumnTitleTranslation =
          column?.titleTranslations?.find(
            (translation) => translation.language === unicodeLocale,
          )?.translation ?? ''

        let previousFieldOptionsTranslations: string[] = []

        if (column.columnType === BasicField.Dropdown) {
          previousFieldOptionsTranslations =
            column?.fieldOptionsTranslations?.find(
              (translation) => translation.language === unicodeLocale,
            )?.translation ?? []
        }

        const previousFieldOptionsTranslationsString =
          previousFieldOptionsTranslations.join('\n')

        return (
          <Flex justifyContent="flex-start" mb="2.5rem" direction="column">
            <Text
              color="secondary.500"
              fontSize="1.25rem"
              fontWeight="600"
              mb="1rem"
            >
              Column
            </Text>
            <Flex direction="column" width="100%">
              <Flex alignItems="flex-start" mb="2rem">
                <Text
                  color="secondary.700"
                  fontWeight="400"
                  mr="7.5rem"
                  width="6.25rem"
                >
                  Default
                </Text>
                <Textarea
                  placeholder={column.title}
                  width="100%"
                  isDisabled={true}
                  padding="0.75rem"
                  resize="none"
                />
              </Flex>
              <Flex alignItems="flex-start">
                <Text color="secondary.700" mr="7.5rem" width="6.25rem">
                  {language}
                </Text>
                <FormControl>
                  <Textarea
                    defaultValue={previousColumnTitleTranslation}
                    {...register(`tableColumnTitleTranslations.${index}`)}
                  />
                </FormControl>
              </Flex>
            </Flex>
            {column.columnType === BasicField.Dropdown && (
              <Flex direction="column" width="100%">
                <Text
                  color="secondary.500"
                  fontSize="1.25rem"
                  fontWeight="600"
                  mb="1rem"
                  mt="2rem"
                >
                  Options
                </Text>
                <Flex alignItems="flex-start" mb="2rem">
                  <Text
                    color="secondary.700"
                    fontWeight="400"
                    mr="7.5rem"
                    width="6.25rem"
                  >
                    Default
                  </Text>
                  <Textarea
                    placeholder={column.fieldOptions?.join('\n') ?? ''}
                    isDisabled={true}
                    overflow="hidden"
                  />
                </Flex>
                <Flex alignItems="flex-start">
                  <Text color="secondary.700" mr="7.5rem" width="6.25rem">
                    {language}
                  </Text>
                  <FormControl>
                    <Textarea
                      width="100%"
                      {...register(`tableColumnDropdownTranslations.${index}`)}
                      defaultValue={previousFieldOptionsTranslationsString}
                    />
                  </FormControl>
                </Flex>
              </Flex>
            )}
            {index !== columns.length - 1 && <Divider mt="2.5rem" />}
          </Flex>
        )
      })}
    </>
  )
}
