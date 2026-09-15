import { MyInfoChildAttributes } from '../../../types/field'

/**
 * Child sub-fields no longer offered in the form builder. MyInfo returns
 * `secondaryrace` empty while every child sub-field is mandatory on submission,
 * so a form collecting it could not be submitted. Removed builder-forward only —
 * the enum member, its display metadata and the scope mapping all stay so
 * existing forms and stored responses keep working; datafix/outreach retires them.
 */
export const DEPRECATED_MYINFO_CHILD_ATTRIBUTES: MyInfoChildAttributes[] = [
  MyInfoChildAttributes.ChildSecondaryRace,
]

/** Child sub-fields an admin may add to a children field in the builder. */
export const SELECTABLE_MYINFO_CHILD_ATTRIBUTES: MyInfoChildAttributes[] =
  Object.values(MyInfoChildAttributes).filter(
    (attr) => !DEPRECATED_MYINFO_CHILD_ATTRIBUTES.includes(attr),
  )

/** A children field collects exactly one child. */
export const MAX_CHILDREN_PER_FIELD = 1
