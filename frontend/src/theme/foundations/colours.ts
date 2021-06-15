export type ThemeColorScheme =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'warning'
  | 'success'
  | 'neutral'
  | 'theme-green'
  | 'theme-teal'
  | 'theme-purple'
  | 'theme-grey'
  | 'theme-yellow'
  | 'theme-orange'
  | 'theme-red'
  | 'theme-brown'

export const colours = {
  primary: {
    100: '#F6F7FC',
    200: '#E4E7F6',
    300: '#B7C0E6',
    400: '#8998D6',
    500: '#4A61C0',
    600: '#3B4E9A',
    700: '#2C3A73',
    800: '#1E274D',
    900: '#161D3A',
  },
  secondary: {
    100: '#F5F6F8',
    200: '#DADCE3',
    300: '#A2A8B9',
    400: '#69738E',
    500: '#445072',
    600: '#36405B',
    700: '#293044',
    800: '#1B202E',
    900: '#0E1017',
  },
  danger: {
    100: '#FFF8F8',
    200: '#F8EAEA',
    300: '#E8C1C1',
    400: '#D88888',
    500: '#C05050',
    600: '#AD4848',
    700: '#9A4040',
    800: '#733030',
    900: '#602828',
  },
  warning: {
    100: '#FFFCF2',
    200: '#FDF3D1',
    300: '#FCECB3',
    400: '#FBE495',
    500: '#F9D867',
    600: '#E0C25D',
    700: '#AE9748',
    800: '#7D6C34',
    900: '#4B411F',
  },
  success: {
    100: '#E6FCF7',
    200: '#CDF5EB',
    300: '#9BEBD7',
    400: '#50DBB8',
    500: '#05CC9A',
    600: '#05B88B',
    700: '#038564',
    800: '#03664D',
    900: '#023D2E',
  },
  neutral: {
    100: '#FBFCFD',
    200: '#F0F0F1',
    300: '#E1E2E4',
    400: '#C9CCCF',
    500: '#ABADB2',
    600: '#999B9F',
    700: '#636467',
    800: '#48494B',
    900: '#242425',
  },
  'theme-green': {
    100: '#F3F6F6',
    300: '#B3CCC6',
    500: '#357867',
    700: '#025641',
  },
  'theme-teal': {
    100: '#F3F6F8',
    300: '#D0DEE4',
    500: '#417E98',
    700: '#1B6483',
  },
  'theme-purple': {
    100: '#F4F2F5',
    300: '#D3C1DC',
    500: '#9265A7',
    700: '#583D64',
  },
  'theme-grey': {
    100: '#F6F6F6',
    300: '#CCD2D6',
    500: '#495C66',
    700: '#2C373D',
  },
  'theme-yellow': {
    100: '#F5F4EE',
    300: '#EADCA8',
    500: '#F9D651',
    700: '#847642',
  },
  'theme-orange': {
    100: '#FAF7F4',
    300: '#F0C09D',
    500: '#F66F23',
    700: '#BF5200',
  },
  'theme-red': {
    100: '#FAF7F7',
    300: '#F5BFBF',
    500: '#DC2A2A',
    700: '#B22222',
  },
  'theme-brown': {
    100: '#F6F5F3',
    300: '#C6BDB4',
    500: '#7F6F5E',
    700: '#635649',
  },
}
