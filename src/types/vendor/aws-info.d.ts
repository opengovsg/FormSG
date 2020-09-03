declare module 'aws-info' {
  type Data = {
    regions: Record<string, unknown>
    services: Record<string, unknown>
  }

  export const data: Data

  export function endpoint(serviceName: string, regionName: string): string

  export function regionName(regionNameShort: string): string
}
