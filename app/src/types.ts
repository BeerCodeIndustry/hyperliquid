export interface Account {
  id?: string;
  name: string;
  public_address: string;
  api_private_key: string;
  proxy_id?: string;
}

export interface Proxy {
  id?: string;
  name: string;
  host: string;
  port: string;
  username: string;
  password: string;
}

export interface HeadCell {
  disablePadding: boolean;
  id: string;
  label: string;
  align: "left" | "center" | "right" | "inherit" | "justify" | undefined;
}
