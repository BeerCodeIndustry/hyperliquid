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
  name: string
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
  account_1_id: string
  account_2_id: string
  unit_timings: string
  constant_timing: number
  user_id?: string
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

export interface AccountState {
  assetPositions: Position[]
  marginSummary: { accountValue: string; totalRawUsd: string }
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
