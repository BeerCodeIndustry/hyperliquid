export interface Account {
  id?: string;
  name: string;
  public_address: string;
  api_private_key: string;
  proxy_id?: string
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
  label: React.ReactNode;
  align: "left" | "center" | "right" | "inherit" | "justify" | undefined;
}

export interface Batch {
  id?: string;
  account_1_id: string
  account_2_id: string
}

export interface Position {
  type: string
  position: {
    coin: string
    positionValue: string
    liquidationPx: string
  }
}

export interface Order {
  coin: string;
  limitPx: string;
  origSz: string;
  orderType: string;
}