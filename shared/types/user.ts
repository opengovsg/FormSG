import { z } from 'zod'
import type { Tagged } from 'type-fest'

import { DateString } from './generic'
import { AgencyBase, AgencyDto, PublicAgencyDto } from './agency'
export type UserId = Tagged<string, 'UserId'>

export enum SeenFlags {
  LastSeenFeatureUpdateVersion = 'lastSeenFeatureUpdateVersion',
  SettingsNotification = 'settingsNotification',
  CreateBuilderMrfWorkflow = 'createBuilderMrfWorkflow',
}

// Base used for being referenced by schema/model in the backend.
// Note the lack of typing of _id.
export const UserBase = z.object({
  email: z.string().email(),
  agency: AgencyBase.shape._id,
  betaFlags: z
    .object({
      payment: z.boolean().optional(),
      children: z.boolean().optional(),
      postmanSms: z.boolean().optional(),
      // TODO: (MRF-email-notif) Remove betaFlag when MRF email notifications is out of beta
      mrfEmailNotifications: z.boolean().optional(),
      mrfAdminSubmissionKey: z.boolean().optional(),
      mfb: z.boolean().optional(),
    })
    .optional(),
  flags: z.record(z.nativeEnum(SeenFlags), z.number()).optional(),
  created: z.date(),
  lastAccessed: z.date().optional(),
  updatedAt: z.date(),
  contact: z.string().optional(),
  apiToken: z
    .object({
      keyHash: z.string(),
      createdAt: z.date(),
      lastUsedAt: z.date().optional(),
      isPlatform: z.boolean().optional(),
    })
    .optional(),
})
export type UserBase = z.infer<typeof UserBase>

// Convert to serialized versions.
export const UserDto = UserBase.extend({
  _id: z.string() as unknown as z.Schema<UserId>,
  agency: AgencyDto.extend({
    created: DateString,
    lastModified: DateString,
  }),
  created: DateString,
  lastAccessed: DateString.optional(),
  updatedAt: DateString,
})
export type UserDto = z.infer<typeof UserDto>

export type PublicUserDto = {
  agency: PublicAgencyDto
}

export type SendUserContactOtpDto = {
  contact: string
  userId: string
}

export type VerifyUserContactOtpDto = {
  userId: string
  otp: string
  contact: string
}

export type SendOtpResponseDto = {
  message: string
  otpPrefix: string
}

export type GetSgidAuthUrlResponseDto = {
  redirectUrl: string
}

export type TransferOwnershipRequestDto = {
  email: string
}

export type TransferOwnershipResponseDto = {
  email: string
  formIds: string[]
  error: string
}
export type UpdateUserLastSeenFlagDto = {
  version: number
  flag: SeenFlags
}
