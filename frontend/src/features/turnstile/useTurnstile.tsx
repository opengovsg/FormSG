import { useEffect, useState } from 'react'

import { useScript } from '~hooks/useScript'

const DEFAULT_CONTAINER_ID = '#turnstile-container'

type TurnstileBaseConfig = {
  sitekey?: string
  callback?: (token: any) => void
}

interface UseTurnstileProps extends TurnstileBaseConfig {
  containerID?: string
}

type TurnstileCallbacks = {
  ready: (callback: () => void) => void
  render: (
    containerID?: string,
    config?: TurnstileBaseConfig,
  ) => string | undefined
  getResponse: (widgetID: string | undefined) => any
}

declare global {
  interface Window {
    turnstile?: TurnstileCallbacks
  }
}

export const useTurnstile = ({
  containerID = DEFAULT_CONTAINER_ID,
  sitekey,
}: UseTurnstileProps) => {
  useScript(
    'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',
    true,
  )
  // important
  // useEffect(() => {
  //   const turnstile = window.turnstile
  //   if (turnstile && sitekey) {
  //     turnstile.ready(function () {
  //       if (widgetID === '') {
  //         const widget = turnstile.render(containerID, {
  //           sitekey: sitekey,
  //           callback: function (token: any) {
  //             console.log(`Challenge Success ${token}`)
  //           },
  //         })
  //       }
  //     })
  //   }
  // }, [window.turnstile, sitekey])

  const getTurnstileResponse = async () => {
    const turnstile = window.turnstile
    let widgetID: string | undefined = ''
    console.log('widgetID', widgetID)
    console.log('render')
    if (turnstile && sitekey) {
      turnstile.ready(async function () {
        widgetID = await turnstile.render(containerID, {
          sitekey: sitekey,
          callback: function (token: any) {
            console.log(`Challenge Success ${token}`)
          },
        })
        console.log('widgetID2', widgetID)
      })
    }
    // turnstile
    // return new Promise<string | undefined>((resolve, reject) => {
    //   return turnstile.
    // })
  }
  return getTurnstileResponse
}
