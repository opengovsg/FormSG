import { useCallback, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BroadcastChannel } from 'broadcast-channel'

import { useHasChanged } from '~hooks/useHasChanged'

import { adminFormResponsesKeys } from '../../queries'

const SECRETKEY_BROADCAST_KEY = 'formsg_private_key_sharing'

type SecretKeyBroadcastMessage =
  | {
      formId: string
      action: 'requestKey'
    }
  | {
      formId: string
      action: 'broadcastKey'
      secretKey: string
    }

export const useSecretKey = (formId: string) => {
  const { data: secretKey } = useQuery({
    queryKey: adminFormResponsesKeys.secretKey(formId),
    initialData: '',
  })

  const queryClient = useQueryClient()
  const setSecretKey = useCallback(
    (secretKey: string) =>
      queryClient.setQueryData(
        adminFormResponsesKeys.secretKey(formId),
        secretKey,
      ),
    [formId, queryClient],
  )

  const hasSecretKeyChanged = useHasChanged(secretKey)

  // BroadcastChannel will only broadcast the message to scripts from the same origin
  // (i.e. https://form.gov.sg in practice) so all data should be controlled by scripts
  // originating from FormSG. This does not store any data in browser-based storage
  // (e.g. cookies or localStorage) so secrets would not be retained past the user closing
  // all Form tabs containing the form.
  const channelRef = useRef<BroadcastChannel<SecretKeyBroadcastMessage>>()

  useEffect(() => {
    const secretKeyChannel = new BroadcastChannel<SecretKeyBroadcastMessage>(
      SECRETKEY_BROADCAST_KEY,
    )
    channelRef.current = secretKeyChannel

    return () => {
      secretKeyChannel.close()
    }
  }, [])

  // Request secret key on mount.
  useEffect(() => {
    if (channelRef.current?.isClosed) return
    channelRef.current?.postMessage({
      formId,
      action: 'requestKey',
    })
  }, [formId])

  // Broadcast when key changes.
  useEffect(() => {
    if (hasSecretKeyChanged && secretKey && !channelRef.current?.isClosed) {
      channelRef.current?.postMessage({
        formId,
        action: 'broadcastKey',
        secretKey,
      })
    }
  }, [secretKey, formId, hasSecretKeyChanged])

  // Message handling.
  useEffect(() => {
    if (channelRef.current) {
      channelRef.current.onmessage = (e) => {
        if (channelRef.current?.isClosed) return
        switch (e.action) {
          case 'requestKey':
            if (secretKey && e.formId === formId) {
              channelRef.current?.postMessage({
                formId,
                action: 'broadcastKey',
                secretKey,
              })
            }
            break
          case 'broadcastKey':
            if (!secretKey && formId === e.formId) {
              setSecretKey(e.secretKey)
            }
        }
      }
    }
  }, [secretKey, formId, setSecretKey])

  return [secretKey, setSecretKey] as const
}
