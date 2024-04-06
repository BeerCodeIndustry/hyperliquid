import { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { SUPABASE_DB } from './db/SUPABASE_DB'
import { Account, Batch, Proxy } from './types'

interface GlobalContextType {
  proxies: Proxy[]
  accounts: Account[]
  batches: Batch[]
  addAccount: (account: Account) => void
  getAccountProxy: (account: Account) => Proxy | undefined
  removeAccounts: (accountIds: string[]) => void
  removeProxies: (proxyIds: string[]) => void
  addProxy: (proxy: Proxy) => void
  linkAccountsProxy: (
    accounts: Account['public_address'][],
    stringifyProxy: string,
  ) => void
  createBatch: ({
    account_1_id,
    account_2_id,
  }: {
    account_1_id: string
    account_2_id: string
  }) => void
  closeBatch: (batchId: string) => void
}

export const GlobalContext = createContext<GlobalContextType>({
  proxies: [],
  accounts: [],
  batches: [],
  addAccount: () => {},
  addProxy: () => {},
  removeAccounts: () => {},
  removeProxies: () => {},
  getAccountProxy: () => ({}) as Proxy,
  linkAccountsProxy: () => {},
  createBatch: () => {},
  closeBatch: () => {},
})

const db = new SUPABASE_DB()

export const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
  const [proxies, setProxies] = useState<Proxy[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [batches, setBatches] = useState<Batch[]>([])

  const addAccount = useCallback((account: Account) => {
    db.addAccount(account).then(() => {
      getAccounts()
    })
  }, [])

  const removeAccounts = useCallback((accountIds: string[]) => {
    db.removeAccounts(accountIds).then(() => {
      getAccounts()
    })
  }, [])

  const removeProxies = useCallback((proxyIds: string[]) => {
    db.removeProxies(proxyIds).then(() => {
      getProxies()
    })
  }, [])

  const addProxy = useCallback((proxy: Proxy) => {
    db.addProxy(proxy).then(() => {
      getProxies()
    })
  }, [])

  const getAccountProxy = (account: Account) => {
    return proxies.find(proxy => proxy.id === account.proxy_id)
  }

  const getAccounts = useCallback(() => {
    db.getAccounts().then(accounts => {
      setAccounts(accounts)
    })
  }, [])

  const getBatches = useCallback(() => {
    db.getBatches().then(batches => {
      console.log(batches, 'batches')
      setBatches(batches)
    })
  }, [])

  const getProxies = useCallback(() => {
    db.getProxies().then(proxies => {
      setProxies(proxies)
    })
  }, [])

  const linkAccountsProxy = useCallback(
    (accountIds: string[], proxyId: string) => {
      db.connectProxyToAccounts(accountIds, proxyId).then(() => {
        getAccounts()
      })
    },
    [],
  )

  const createBatch = useCallback(
    ({
      account_1_id,
      account_2_id,
    }: {
      account_1_id: string
      account_2_id: string
    }) => {
      db.createBatch(account_1_id, account_2_id).then(() => {
        getBatches()
      })
    },
    [proxies],
  )

  const closeBatch = useCallback((batchId: string) => {
    db.closeBatch(batchId).then(() => {
      getBatches()
    })
  }, [])

  const value = useMemo(
    () => ({
      proxies,
      accounts,
      batches,
      addAccount,
      addProxy,
      removeAccounts,
      removeProxies,
      getAccountProxy,
      linkAccountsProxy,
      createBatch,
      closeBatch,
    }),
    [proxies, accounts, batches],
  )

  useEffect(() => {
    getAccounts()
    getProxies()
    getBatches()
  }, [])

  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  )
}
