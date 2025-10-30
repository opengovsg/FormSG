import { PartialDeep } from 'type-fest'

import { Fields } from '.'

export const taSG: PartialDeep<Fields> = {
  yesNo: {
    yes: 'ஆம்',
    no: 'இல்லை',
  },
  option: {
    others: 'மற்றவை',
  },
  dropdown: {
    placeholder: 'ஒரு விருப்பத்தை தேர்வு செய்யவும்',
    nothingFound: 'முடிவுகள் எதுவும் பொருந்தவில்லை',
    clearSelection: 'தேர்வை அழிக்கவும்',
    selectOptions: 'விருப்பங்களைத் தேர்ந்தெடுக்கவும்',
  },
  attachment: {
    maxFileSize: 'கோப்பின் அதிகபட்ச அளவு: {readableMaxSize}',
  },
  email: {
    validation: {
      domainDisallowed:
        'உள்ளிடப்பட்ட மின்னஞ்சல் அனுமதிக்கப்பட்ட மின்னஞ்சலுக்குச் சொந்தமானதல்ல',
    },
  },
  verification: {
    button: {
      label: {
        verify: 'சரிபார்க்கவும்',
        verified: 'சரிபார்க்கப்பட்டது',
      },
    },
    modal: {
      email: {
        title: 'உங்கள் மின்னஞ்சல் முகவரியைச் சரிபார்க்கவும்',
        description:
          '6 இலக்க சரிபார்ப்புக் குறியீடு கொண்ட மின்னஞ்சல் உங்களுக்கு அனுப்பப்பட்டுள்ளது. 30 நிமிடங்களுக்கு இது செல்லுபடியாகும்.',
      },
      mobile: {
        title: 'உங்கள் மொபைல் எண்ணைச் சரிபார்க்கவும்',
        description:
          '6 இலக்க சரிபார்ப்புக் குறியீடு கொண்ட எஸ்எம்எஸ் உங்களுக்கு அனுப்பப்பட்டுள்ளது. 30 நிமிடங்களுக்கு இது செல்லுபடியாகும்.',
      },
    },
  },
}
