export interface Account {
  id?: string
  name: string
  public_address: string
  api_private_key: string
  proxy_id?: string
}

export interface Proxy {
  id?: string
  name: string
  host: string
  port: string
  username: string
  password: string
}

export interface HeadCell {
  disablePadding: boolean
  id: string
  label: React.ReactNode
  align: 'left' | 'center' | 'right' | 'inherit' | 'justify' | undefined
}

export interface Batch {
  id?: string
  account_1_id: string
  account_2_id: string
}

export interface Position {
  type: string
  position: {
    coin: string
    positionValue: string
    liquidationPx: string
    szi: string
  }
}

export interface Order {
  coin: string
  limitPx: string
  origSz: string
  orderType: string
  timestamp: number
}

export interface AccountState {
  channel: string
  clearinghouseState: {
    assetPositions: Position[]
    marginSummary: { accountValue: string; totalRawUsd: string }
  }
  openOrders: Order[]
  user: string
}

export interface Unit {
  base_unit_info: {
    asset: string
    timestamp: number
  }
  positions: {
    public_address: string
    info: {
      szi: string
      positionValue: string
      liquidationPx: string
    }
  }[]
  orders: {
    public_address: string
    info: {
      limitPx: string
      origSz: string
    }
  }[]
}

export interface BatchAccount {
  account: Account
  proxy?: Proxy
}

// UserState =>
