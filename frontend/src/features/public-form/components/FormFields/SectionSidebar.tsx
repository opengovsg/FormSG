import { useMemo } from 'react'
import { Box, Flex, VStack } from '@chakra-ui/react'

import { BasicField, FormFieldDto } from '~shared/types/field'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { useFormSections } from './FormSectionsContext'
import { SidebarLink } from './SidebarLink'

export type SidebarSectionMeta = Pick<FormFieldDto, 'title' | '_id'>

export const SectionSidebar = (): JSX.Element => {
  const { activeSectionId } = useFormSections()
  const { miniHeaderRef, form } = usePublicFormContext()

  // Used for offsetting the section sidebar when the mini header is open.
  const sectionTopOffset = useMemo(() => {
    // Current height of the mini header + 52px from the top
    const offsetPx = (miniHeaderRef?.current?.clientHeight ?? 0) + 52
    return `${offsetPx}px`
    // Require ignore as miniHeaderRef is an object and dependency comparison
    // will never change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [miniHeaderRef?.current?.clientHeight])

  const scrollData = useMemo(() => {
    if (!form) return []
    const sections: SidebarSectionMeta[] = []
    form.form_fields.forEach((f) => {
      if (f.fieldType !== BasicField.Section) return
      sections.push({
        title: f.title,
        _id: f._id,
      })
    })

    return sections
  }, [form])

  return (
    <Box
      flex={1}
      d={{ base: 'none', md: 'initial' }}
      minW={scrollData.length > 0 ? '20%' : undefined}
    >
      <VStack
        pos="sticky"
        top={sectionTopOffset}
        spacing="1.25rem"
        alignSelf="flex-start"
        align="flex-start"
        marginEnd="1rem"
      >
        {scrollData?.map((d) => (
          <Flex key={d._id} align="center">
            <SidebarLink isActive={activeSectionId === d._id} sectionMeta={d} />
          </Flex>
        ))}
      </VStack>
    </Box>
  )
}
