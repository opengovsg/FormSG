import { FormResponseMode } from '~shared/types'

export const enSG = {
  prettyLastModified: 'Edited {prettyLastModified}',
  relativeDateFormat: {
    sameDay: '[today,] D MMM h:mma', // today, 16 Jun 9:30am
    nextDay: '[tomorrow,] D MMM h:mma', // tomorrow, 16 Jun 9:30am
    lastDay: '[yesterday,] D MMM h:mma', // yesterday, 16 Jun 9:30am
    nextWeek: 'ddd, D MMM YYYY h:mma', // Tue, 17 Oct 2021 9:30pm
    lastWeek: 'ddd, D MMM YYYY h:mma', // Tue, 17 Oct 2021 9:30pm
    sameElse: 'D MMM YYYY h:mma', // 6 Oct 2021 9:30pm
  },
  responseModeText: {
    [FormResponseMode.Multirespondent]: 'Multi-respondent form',
    [FormResponseMode.Email]: 'Email mode',
    [FormResponseMode.Encrypt]: 'Storage mode',
  },
}
