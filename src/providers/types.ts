import type { Logger } from '../util/logger.ts'

export interface DnsProviderContext {
  logger: Logger
}

export interface TxtRecordInput {
  fulldomain: string
  txtvalue: string
}

export interface DnsProvider {
  readonly id: string
  readonly name: string
  createTxtRecord(ctx: DnsProviderContext, record: TxtRecordInput): Promise<void>
  deleteTxtRecord(ctx: DnsProviderContext, record: TxtRecordInput): Promise<void>
}
