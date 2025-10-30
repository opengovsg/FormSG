import { PartialDeep } from 'type-fest'

import { Fields } from '.'

export const msSG: PartialDeep<Fields> = {
  yesNo: {
    yes: 'Ya',
    no: 'Tidak',
  },
  option: {
    others: 'Lain-lain',
  },
  dropdown: {
    placeholder: 'Pilih satu pilihan',
    nothingFound: 'Tiada hasil yang sepadan',
    clearSelection: 'Kosongkan pilihan',
    selectOptions: 'Pilih pilihan',
  },
  attachment: {
    maxFileSize: 'Saiz fail maksimum: {readableMaxSize}',
  },
  email: {
    validation: {
      domainDisallowed:
        'E-mel yang dimasukkan bukan milik domain e-mel yang dibenarkan',
    },
  },
  verification: {
    button: {
      label: {
        verify: 'Sahkan',
        verified: 'Disahkan',
      },
    },
    modal: {
      email: {
        title: 'Sahkan e-mel anda',
        description:
          'E-mel dengan kod pengesahan 6 digit telah dihantar kepada anda. Kod itu sah selama 30 minit.',
      },
      mobile: {
        title: 'Sahkan nombor telefon bimbit anda',
        description:
          'SMS dengan kod pengesahan 6 digit telah dihantar kepada anda. Kod itu sah selama 30 minit.',
      },
    },
  },
  calendar: {
    today: 'Hari ini',
    todayAriaLabel: 'Fokus pada tarikh hari ini',
  },
  datePicker: {
    selectFromDatePicker: 'Pilih dari pemilih tarikh. ',
    selectedDateIs: 'Tarikh yang dipilih ialah {date}.',
    invalidDate: 'Tarikh yang dipilih semasa tidak sah.',
  },
}
