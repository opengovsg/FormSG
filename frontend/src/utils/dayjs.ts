import dayjs from 'dayjs'
import calendar from 'dayjs/plugin/calendar'
import updateLocale from 'dayjs/plugin/updateLocale'

export const init = (): void => {
  dayjs.extend(updateLocale)
  dayjs.extend(calendar)
}
