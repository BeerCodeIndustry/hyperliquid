import { Proxy } from "./types";

export const stringifyProxy = (proxy: Proxy) => {
  return `${proxy.name}:${proxy.ip}:${proxy.port}:${proxy.login}:${proxy.pass}`;
};

export const parseProxy = (proxyString: string): Proxy => {
  const [name, ip, port, login, pass] = proxyString.split(":");

  return { name, ip, port, login, pass };
};
