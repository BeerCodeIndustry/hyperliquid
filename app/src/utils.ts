import { Proxy } from "./types";

export const stringifyProxy = (proxy: Proxy) => {
  if (!proxy) {
    return 'No proxy'
  }

  return `${proxy.name}:${proxy.host}:${proxy.port}:${proxy.username}:${proxy.password}`;
};

export const parseProxy = (proxyString: string): Proxy => {
  const [name, host, port, username, password] = proxyString.split(":");

  return { name, host, port, username, password };
};
