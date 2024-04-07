import { SupabaseClient, createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid';

import { Account, Batch, Proxy } from '../types'

if (
  !import.meta.env.VITE_SUPABASE_PROJECT_URL ||
  !import.meta.env.VITE_SUPABASE_ANON_KEY
) {
  throw new Error('Add .env variables')
}

export class SUPABASE_DB {
  client: SupabaseClient

  constructor() {
    this.client = createClient(
      import.meta.env.VITE_SUPABASE_PROJECT_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
    )
  }

  public addAccount = async (account: Account) => {
    return this.client.from('accounts').insert(account)
  }

  public addAccountWithProxy = async (account: Account, proxy: Proxy) => {
    const id = uuidv4()
    await this.client.from('proxies').insert<Proxy>({...proxy, id})
    return this.client.from('accounts').insert({...account, proxy_id: id})
  }

  public removeAccounts = (accountIds: string[]) => {
    return this.client.from('accounts').delete().in('id', accountIds)
  }

  public addProxy = (proxy: Proxy) => {
    return this.client.from('proxies').insert<Proxy>(proxy)
  }

  public removeProxies = (proxyIds: string[]) => {
    return this.client.from('proxies').delete().in('id', proxyIds)
  }

  public getAccounts = async (): Promise<Account[]> => {
    const { data } = await this.client
      .from('accounts')
      .select<string, Account>()
    return data ?? []
  }

  public getProxies = async (): Promise<Proxy[]> => {
    const { data } = await this.client.from('proxies').select<string, Proxy>()
    return data ?? []
  }

  public connectProxyToAccounts = async (
    accountIds: string[],
    proxyId: string,
  ) => {
    return this.client
      .from('accounts')
      .update({ proxy_id: proxyId })
      .eq('id', accountIds)
  }

  public getBatches = async (): Promise<Batch[]> => {
    const { data } = await this.client.from('batches').select<string, Batch>()
    return data ?? []
  }

  public createBatch = async (account_1_id: string, account_2_id: string, timing: number) => {
    return this.client.from('batches').insert({ account_1_id, account_2_id, constant_timing: timing })
  }

  public setUnitInitTiming = async (batchId: string, asset: string, recreateTiming: number, openedTiming: number) => {
    const batch = await this.client.from('batches').select<string, Batch>().eq('id', batchId)

    if (!batch.data?.[0]) {
      throw new Error('setUnitRecreateTiming')
    }
    const prev_unit_timings = JSON.parse(batch.data[0].unit_timings)

    const unit_timings = JSON.stringify({
      ...prev_unit_timings,
      [asset]: {
        recreateTiming: recreateTiming,
        openedTiming: openedTiming
      }
    })

    return this.client.from('batches').update({ unit_timings }).eq('id', batchId)
  }

  public getUnitTimings = async (batchId: string) => {
    const batch = await this.client.from('batches').select<string, Batch>().eq('id', batchId)

    if (!batch.data?.[0]) {
      throw new Error('setUnitRecreateTiming')
    }

    return JSON.parse(batch.data[0].unit_timings)
  }

  public closeBatch = async (batchId: string) => {
    return this.client.from('batches').delete().eq('id', batchId)
  }
}
