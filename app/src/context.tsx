import {
  createContext,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import { invoke } from "@tauri-apps/api";

import { Proxy, Account } from "./types";
import { stringifyProxy } from "./utils";
import { SUPABASE_DB } from "./db/SUPABASE_DB";

interface GlobalContextType {
  proxies: Proxy[];
  accounts: Account[];
  addAccount: (account: Account) => void;
  getAccountProxy: (account: Account) => Proxy | null;
  addProxy: (proxy: Proxy) => void;
  linkAccountsProxy: (
    accounts: Account["public_address"][],
    stringifyProxy: string
  ) => void;
  initBatch: ({
    account_1,
    account_2,
  }: {
    account_1: Account;
    account_2: Account;
  }) => void;
}

export const GlobalContext = createContext<GlobalContextType>({
  proxies: [],
  accounts: [],
  addAccount: () => {},
  addProxy: () => {},
  getAccountProxy: () => ({} as Proxy),
  linkAccountsProxy: () => {},
  initBatch: () => {},
});

const db = new SUPABASE_DB();

export const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const addAccount = useCallback((account: Account) => {
    db.addAccount(account).then(() => {
      getAccounts();
    })
  }, []);

  const addProxy = useCallback((proxy: Proxy) => {
    db.addProxy(proxy).then(() => {
      getProxies();
    })
  }, []);

  const getAccountProxy = (account: Account) => {
    return proxies.find((proxy) => proxy.id === account.proxy_id) ?? null
  }

  const getAccounts = useCallback(() => {
    db.getAccounts().then((accounts) => {
      setAccounts(accounts)
    })
  }, []);

  const getProxies = useCallback(() => {
    db.getProxies().then((proxies) => {
      setProxies(proxies)
    })
  }, []);

  const linkAccountsProxy = useCallback(
    (accountIds: string[], proxyId: string) => {
      db.connectProxyToAccounts(accountIds, proxyId).then(() => {
        getAccounts();
      })
    },
    []
  );

  const initBatch = useCallback(
    ({ account_1, account_2 }: { account_1: Account; account_2: Account }) => {
      const proxy_1 = stringifyProxy(getAccountProxy(account_1)!)
      const proxy_2 = stringifyProxy(getAccountProxy(account_2)!)

      invoke("init_batch", {
        account1: { account: account_1, proxy: proxy_1 },
        account2: { account: account_2, proxy: proxy_2 },
      }).catch((e) => console.log(e));
    },
    [proxies]
  );

  const value = useMemo(
    () => ({
      proxies,
      accounts,
      addAccount,
      addProxy,
      getAccountProxy,
      linkAccountsProxy,
      initBatch,
    }),
    [proxies, accounts]
  );

  useEffect(() => {
    getAccounts();
    getProxies();
  }, []);

  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  );
};
