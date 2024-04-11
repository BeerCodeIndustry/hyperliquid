import { CircularProgress } from '@mui/material'
import { invoke } from '@tauri-apps/api'
import { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { SUPABASE_DB } from './db/SUPABASE_DB'
import { Account, Batch, Proxy } from './types'
import { parseProxy } from './utils'

interface GlobalContextType {
  proxies: Proxy[]
  accounts: Account[]
  batches: Batch[]
  isAuth: boolean
  login: (username: string, password: string) => Promise<unknown>
  addAccount: (account: Account, proxy?: string) => void
  getAccountProxy: (account: Account) => Proxy | undefined
  removeAccounts: (accountIds: string[]) => void
  removeProxies: (proxyIds: string[]) => void
  addProxy: (proxy: Proxy) => void
  linkAccountsProxy: (
    accounts: Account['public_address'][],
    stringifyProxy: string,
  ) => void
  createBatch: ({
    name,
    account_1_id,
    account_2_id,
    timing,
  }: {
    name: string
    account_1_id: string
    account_2_id: string
    timing: number
  }) => void
  closeBatch: (batchId: string) => void
  getUnitTimings: (
    batchId: string,
  ) => Promise<Record<string, { openedTiming: number; recreateTiming: number }>>
  setUnitInitTimings: (
    batchId: string,
    asset: string,
    recreateTiming: number,
    openedTiming: number,
  ) => Promise<void>
  logout: () => void
}

export const GlobalContext = createContext<GlobalContextType>({
  proxies: [],
  accounts: [],
  batches: [],
  isAuth: false,
  logout: () => {},
  login: async () => {},
  addAccount: () => {},
  addProxy: () => {},
  removeAccounts: () => {},
  removeProxies: () => {},
  getAccountProxy: () => ({}) as Proxy,
  linkAccountsProxy: () => {},
  createBatch: () => {},
  closeBatch: () => {},
  getUnitTimings: async () =>
    ({}) as Record<string, { openedTiming: number; recreateTiming: number }>,
  setUnitInitTimings: async () => {},
})

export const db = new SUPABASE_DB()

export const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
  const [proxies, setProxies] = useState<Proxy[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [batches, setBatches] = useState<Batch[]>([])

  const [isAuth, setIsAuth] = useState(db.isAuth())

  const [loading, setLoading] = useState(false)
  const [authenticating, setAuthenticating] = useState(true)

  const addAccount = useCallback((account: Account, proxy?: string) => {
    if (proxy) {
      db.addAccountWithProxy(account, parseProxy(proxy)).then(() => {
        getProxies()
        getAccounts()
      })
      return
    }
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
    return db.getAccounts().then(accounts => {
      setAccounts(accounts)
    })
  }, [])

  const getBatches = useCallback(() => {
    return db.getBatches().then(batches => {
      setBatches(batches)
    })
  }, [])

  const getProxies = useCallback(() => {
    return db.getProxies().then(proxies => {
      setProxies(proxies)
    })
  }, [])

  const getUnitTimings = useCallback(
    (
      batchId: string,
    ): Promise<
      Record<string, { openedTiming: number; recreateTiming: number }>
    > => {
      return db.getUnitTimings(batchId)
    },
    [],
  )

  const setUnitInitTimings = useCallback(
    (
      batchId: string,
      asset: string,
      recreateTiming: number,
      openedTiming: number,
    ): Promise<void> => {
      return db.setUnitInitTiming(
        batchId,
        asset,
        recreateTiming,
        openedTiming,
      ) as unknown as Promise<void>
    },
    [],
  )

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
      name,
      account_1_id,
      account_2_id,
      timing,
    }: {
      name: string
      account_1_id: string
      account_2_id: string
      timing: number
    }) => {
      db.createBatch(name, account_1_id, account_2_id, timing).then(() => {
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

  const login = useCallback(async (email: string, password: string) => {
    return db.authenticate(email, password).finally(() => {
      setIsAuth(db.isAuth())
      setAuthenticating(false)
    })
  }, [])

  const logout = useCallback(() => {
    db.logout()
    setIsAuth(false)
  }, [])

  const value = useMemo(
    () => ({
      proxies,
      accounts,
      batches,
      isAuth,
      login,
      addAccount,
      addProxy,
      removeAccounts,
      removeProxies,
      getAccountProxy,
      linkAccountsProxy,
      createBatch,
      closeBatch,
      getUnitTimings,
      setUnitInitTimings,
      logout,
    }),
    [proxies, accounts, batches, isAuth],
  )

  useEffect(() => {
    if (!isAuth) {
      return
    }
    setLoading(true)
    Promise.all([getAccounts(), getProxies(), getBatches()]).then(() => {
      setLoading(false)
    })
  }, [isAuth])

  useEffect(() => {
    const email = localStorage.getItem('email')
    const password = localStorage.getItem('password')

    if (email && password) {
      login(email, password)

      return
    }

    setAuthenticating(false)
  }, [])

  useEffect(() => {
    let t: NodeJS.Timeout

    const insertLogs = async () => {
      await invoke('get_logs').then(logs => {
        return db.insertLogs(logs as string[]).then(() => {
          return invoke('clear_logs')
        })
      })

      t = setTimeout(() => {
        insertLogs()
      }, 10000)
    }

    insertLogs()

    return () => {
      clearTimeout(t)
    }
  }, [])

  return (
    <GlobalContext.Provider value={value}>
      {loading || authenticating ? <CircularProgress size={64} /> : children}
    </GlobalContext.Provider>
  )
}
