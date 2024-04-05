import {
  createContext,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import { invoke } from "@tauri-apps/api";

import { Proxy, Account, Batch } from "./types";
import { stringifyProxy } from "./utils";
import { SUPABASE_DB } from "./db/SUPABASE_DB";

interface GlobalContextType {
  proxies: Proxy[];
  accounts: Account[];
  addAccount: (account: Account) => void;
  getAccountProxy: (account: Account) => Proxy | null;
  removeAccounts: (accountIds: string[]) => void;
  removeProxies: (proxyIds: string[]) => void;
  addProxy: (proxy: Proxy) => void;
  linkAccountsProxy: (
    accounts: Account["public_address"][],
    stringifyProxy: string
  ) => void;
  createBatch: ({
    account_1_id,
    account_2_id,
  }: {
    account_1_id: string;
    account_2_id: string;
  }) => void;
}

export const GlobalContext = createContext<GlobalContextType>({
  proxies: [],
  accounts: [],
  addAccount: () => {},
  addProxy: () => {},
  removeAccounts: () => {},
  removeProxies: () => {},
  getAccountProxy: () => ({} as Proxy),
  linkAccountsProxy: () => {},
  createBatch: () => {},
});

const db = new SUPABASE_DB();

export const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  const addAccount = useCallback((account: Account) => {
    db.addAccount(account).then(() => {
      getAccounts();
    });
  }, []);

  const removeAccounts = useCallback((accountIds: string[]) => {
    db.removeAccounts(accountIds).then(() => {
      getAccounts();
    });
  }, []);

  const removeProxies = useCallback((proxyIds: string[]) => {
    db.removeProxies(proxyIds).then(() => {
      getProxies();
    });
  }, []);

  const addProxy = useCallback((proxy: Proxy) => {
    db.addProxy(proxy).then(() => {
      getProxies();
    });
  }, []);

  const getAccountProxy = (account: Account) => {
    return proxies.find((proxy) => proxy.id === account.proxy_id) ?? null;
  };

  const getAccounts = useCallback(() => {
    db.getAccounts().then((accounts) => {
      setAccounts(accounts);
    });
  }, []);

  const getBatches = useCallback(() => {
    db.getBatches().then((batches) => {
      setBatches(batches);
    });
  }, []);

  const getProxies = useCallback(() => {
    db.getProxies().then((proxies) => {
      setProxies(proxies);
    });
  }, []);

  const linkAccountsProxy = useCallback(
    (accountIds: string[], proxyId: string) => {
      db.connectProxyToAccounts(accountIds, proxyId).then(() => {
        getAccounts();
      });
    },
    []
  );

  const createBatch = useCallback(
    ({
      account_1_id,
      account_2_id,
    }: {
      account_1_id: string;
      account_2_id: string;
    }) => {
      db.createBatch(account_1_id, account_2_id).then(() => {
        getBatches();
      });
    },
    [proxies]
  );

  const value = useMemo(
    () => ({
      proxies,
      accounts,
      addAccount,
      addProxy,
      removeAccounts,
      removeProxies,
      getAccountProxy,
      linkAccountsProxy,
      createBatch,
    }),
    [proxies, accounts]
  );

  useEffect(() => {
    getAccounts();
    getProxies();
    getBatches();
  }, []);

  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  );
};
