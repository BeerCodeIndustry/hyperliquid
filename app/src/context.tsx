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

interface GlobalContextType {
  proxies: Proxy[];
  accounts: Account[];
  accountProxy: Record<Account["public_address"], string>;
  addAccount: (account: Account) => void;
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
  accountProxy: {},
  addAccount: () => {},
  addProxy: () => {},
  linkAccountsProxy: () => {},
  initBatch: () => {},
});

export const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountProxy, setAccountProxy] = useState<
    Record<Account["public_address"], string>
  >({});

  const addAccount = useCallback((account: Account) => {
    invoke("add_account", {
      data: `${account.name}//${account.public_address}//${account.api_private_key}`,
    });
    getAccounts();
  }, []);

  const addProxy = useCallback((proxy: Proxy) => {
    invoke("add_proxy", {
      data: `${proxy.name}:${proxy.ip}:${proxy.port}:${proxy.login}:${proxy.pass}`,
    });
    getProxies();
  }, []);

  const getAccounts = useCallback(() => {
    invoke("parse_accounts").then((accounts) =>
      setAccounts(accounts as Account[])
    );
  }, []);

  const getProxies = useCallback(() => {
    invoke("parse_proxy").then((proxies) => setProxies(proxies as Proxy[]));
  }, []);

  const getAccountProxy = useCallback(() => {
    invoke("parse_account_proxy")
      .then((accountsProxy) =>
        setAccountProxy(
          accountsProxy as Record<Account["public_address"], string>
        )
      )
      .catch((e) => console.log(e));
  }, []);

  const linkAccountsProxy = useCallback(
    (accounts: Account["public_address"][], stringifyProxy: string) => {
      invoke("link_account_proxy", {
        data: accounts.map((s) => `${s}//${stringifyProxy}`).join("\n"),
      });
      getAccountProxy();
    },
    []
  );

  const initBatch = useCallback(
    ({ account_1, account_2 }: { account_1: Account; account_2: Account }) => {
      const proxy_1 = proxies.find(
        (p) => stringifyProxy(p) === accountProxy[account_1.public_address]
      );
      const proxy_2 = proxies.find(
        (p) => stringifyProxy(p) === accountProxy[account_2.public_address]
      );

      invoke("init_batch", {
        account1: { account: account_1, proxy: proxy_1 },
        account2: { account: account_2, proxy: proxy_2 },
      }).catch((e) => console.log(e));
    },
    [proxies, accountProxy]
  );

  const value = useMemo(
    () => ({
      accountProxy,
      proxies,
      accounts,
      addAccount,
      addProxy,
      linkAccountsProxy,
      initBatch,
    }),
    [proxies, accounts, accountProxy]
  );

  useEffect(() => {
    getAccounts();
    getProxies();
    getAccountProxy();
  }, []);

  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  );
};
