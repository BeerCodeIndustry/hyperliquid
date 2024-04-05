export interface Account {
  name: string;
  public_address: string;
  api_private_key: string;
}

export interface Proxy {
  name: string;
  ip: string;
  port: string;
  login: string;
  pass: string;
}

export interface HeadCell {
  disablePadding: boolean;
  id: string;
  label: string;
  align: "left" | "center" | "right" | "inherit" | "justify" | undefined;
}
