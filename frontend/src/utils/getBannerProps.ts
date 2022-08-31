import { BannerVariant } from '~theme/components/Banner'

export type BannerProps = {
  variant: BannerVariant
  msg: string
}

export const getBannerProps = (bannerContent?: string): BannerProps | null => {
  if (!bannerContent) return null
  if (bannerContent.startsWith('info:')) {
    return {
      variant: 'info',
      msg: bannerContent.slice(5).trim(),
    }
  }
  if (bannerContent.startsWith('warn:')) {
    return {
      variant: 'warn',
      msg: bannerContent.slice(5).trim(),
    }
  }
  if (bannerContent.startsWith('error:')) {
    return {
      variant: 'error',
      msg: bannerContent.slice(6).trim(),
    }
  }
  return {
    variant: 'info',
    msg: bannerContent.trim(),
  }
}
