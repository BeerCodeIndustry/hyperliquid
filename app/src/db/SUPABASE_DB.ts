import {
  Session,
  SupabaseClient,
  User,
  WeakPassword,
  createClient,
} from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

import { Account, Batch, LogRow, Proxy } from '../types'
import { formatLogs } from '../utils'

if (
  !import.meta.env.VITE_SUPABASE_PROJECT_URL ||
  !import.meta.env.VITE_SUPABASE_ANON_KEY
) {
  throw new Error('Add .env variables')
}

export class SUPABASE_DB {
  client: SupabaseClient
  unitTimingChanges: Record<
    string,
    { openedTiming: number; recreateTiming: number }
  >
  unitTimingTimeoutId: NodeJS.Timeout | null
  auth: {
    user: User
    session: Session
    weakPassword?: WeakPassword
  } | null

  constructor() {
    this.client = createClient(
      import.meta.env.VITE_SUPABASE_PROJECT_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
    )

    this.unitTimingChanges = {}
    this.unitTimingTimeoutId = null

    this.auth = null
  }

  public isAuth = () => {
    return Boolean(this.auth)
  }

  public authenticate = async (email: string, password: string) => {
    return new Promise((resolve, reject) => {
      this.client.auth
        .signInWithPassword({
          email,
          password,
        })
        .then(res => {
          if (res.error) {
            reject(res.error.message)
            return
          }
          if (res.data.user && res.data.session) {
            localStorage.setItem('email', email)
            localStorage.setItem('password', password)
            this.auth = res.data
          }

          resolve(res)
        })
        .finally(() => {
          reject('')
        })
    })
  }

  public logout = () => {
    localStorage.removeItem('email')
    localStorage.removeItem('password')

    this.auth = null
    this.client.auth.signOut()
  }

  public addAccount = async (account: Account) => {
    if (!this.auth) {
      throw new Error('401')
    }

    return this.client
      .from('accounts')
      .insert({ ...account, user_id: this.auth.user.id })
  }

  public addAccountWithProxy = async (account: Account, proxy: Proxy) => {
    const id = uuidv4()
    await this.client.from('proxies').insert<Proxy>({ ...proxy, id })
    return this.client.from('accounts').insert({ ...account, proxy_id: id })
  }

  public removeAccounts = (accountIds: string[]) => {
    return this.client.from('accounts').delete().in('id', accountIds)
  }

  public addProxy = (proxy: Proxy) => {
    if (!this.auth) {
      throw new Error('401')
    }

    return this.client
      .from('proxies')
      .insert<Proxy>({ ...proxy, user_id: this.auth.user.id })
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

  public createBatch = async (
    name: string,
    account_1_id: string,
    account_2_id: string,
    timing: number,
  ) => {
    if (!this.auth) {
      throw new Error('401')
    }

    return this.client.from('batches').insert({
      name,
      account_1_id,
      account_2_id,
      constant_timing: timing,
      user_id: this.auth.user.id,
    })
  }

  public setUnitInitTiming = async (
    batchId: string,
    asset: string,
    recreateTiming: number,
    openedTiming: number,
  ) => {
    this.unitTimingChanges = {
      ...this.unitTimingChanges,
      [asset]: {
        openedTiming,
        recreateTiming,
      },
    }

    if (this.unitTimingTimeoutId) {
      clearTimeout(this.unitTimingTimeoutId)
    }

    this.unitTimingTimeoutId = setTimeout(() => {
      this.applyUnitTimingChanges(batchId)
    }, 100)
  }

  private applyUnitTimingChanges = async (batchId: string) => {
    const batch = await this.client
      .from('batches')
      .select<string, Batch>()
      .eq('id', batchId)

    if (!batch.data?.[0]) {
      throw new Error('setUnitRecreateTiming')
    }

    const prev_unit_timings = JSON.parse(batch.data[0].unit_timings)

    const unit_timings = JSON.stringify({
      ...prev_unit_timings,
      ...this.unitTimingChanges,
    })

    this.unitTimingChanges = {}

    return this.client
      .from('batches')
      .update({ unit_timings })
      .eq('id', batchId)
  }

  public getUnitTimings = async (batchId: string) => {
    const batch = await this.client
      .from('batches')
      .select<string, Batch>()
      .eq('id', batchId)

    if (!batch.data?.[0]) {
      throw new Error('setUnitRecreateTiming')
    }

    return JSON.parse(batch.data[0].unit_timings)
  }

  public closeBatch = async (batchId: string) => {
    return this.client.from('batches').delete().eq('id', batchId)
  }

  public getLogs = async (start: string, end: string) => {
    return (
      await this.client
        .from('logs')
        .select<string, LogRow>('*')
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: true })
    ).data
  }

  public insertLogs = async (logs: string[]) => {
    return this.client.from('logs').insert(formatLogs(logs, this.auth?.user.id))
  }
}
