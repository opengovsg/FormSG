export type WaitingRoomLockedErrorDto = {
  inactiveMessage: string
}

export type WaitingRoomStatusDto = {
  waitSeconds: number
  targetFormId: string
  maxWaitMinutes: number
}
