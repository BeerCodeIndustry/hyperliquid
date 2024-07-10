export interface Account {
  id?: string
  name: string
  user_id?: string
  public_address: string
  api_private_key: string
  proxy_id?: string
}

export interface Proxy {
  id?: string
  host: string
  port: string
  username: string
  password: string
  user_id?: string
}

export interface HeadCell {
  disablePadding: boolean
  id: string
  label: React.ReactNode
  align: 'left' | 'center' | 'right' | 'inherit' | 'justify' | undefined
}

export interface Batch {
  id?: string
  name: string
  smart_balance_usage: boolean
  accounts: string[]
  unit_timings: string
  unit_sizes: string
  constant_timing: number
  user_id?: string
}

export interface SpotMeta {
  tokens: {
    index: number
    name: string
    szDecimals: number
  }[]
  universe: {
    index: number
    name: string
    tokens: [number, number]
  }[]
}

export interface Position {
  type: string
  position: {
    coin: string
    positionValue: string
    liquidationPx: string
    leverage: {
      value: number
    }
    szi: string
  }
}

export interface Trader {
  name: string
  public_address: string
  user_id?: string
}

export interface TraderOrder {
  id: number
  trader_id: string
  size: number
  coin: string
  status: 'opened' | 'filled' | 'canceled' | 'rejected'
  opened_at: number
}

export interface AccountState {
  assetPositions: Position[]
  marginSummary: {
    accountValue: string
    totalRawUsd: string
    totalMarginUsed: string
  }
}

export interface Unit {
  base_unit_info: {
    asset: string
    leverage: number
    size: number
  }
  positions: {
    info: {
      szi: string
      positionValue: string
      leverage: number
      liquidationPx: string
    }
  }[]
}

export interface BatchAccount {
  account: Account
  proxy?: Proxy
}

export interface LogRow {
  id: number
  created_at: string
  user_id: string
  text: string
}
