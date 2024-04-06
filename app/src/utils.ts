import { Account, AccountState, BatchAccount, Proxy, Unit } from './types'

export const stringifyProxy = (proxy: Proxy) => {
  if (!proxy) {
    return 'No proxy'
  }

  return `${proxy.name}:${proxy.host}:${proxy.port}:${proxy.username}:${proxy.password}`
}

export const parseProxy = (proxyString: string): Proxy => {
  const [name, host, port, username, password] = proxyString.split(':')

  return { name, host, port, username, password }
}

export const connectSocket = (cb: (socket: WebSocket | null) => void) => {
  const connection = new WebSocket('wss://api.hyperliquid.xyz/ws')

  connection.onopen = () => {
    cb(connection)
    console.log('socket connected')
  }
  connection.onclose = () => {
    cb(null)
    setTimeout(connectSocket, 3000)
    connectSocket(cb)
    console.log('socket disconnected')
  }
  connection.onerror = () => {
    connection?.close()
    console.log('socket error')
  }
}

export const transformAccountStatesToUnits = (
  accountStates: AccountState[],
): Unit[] => {
  if (!accountStates.length) return []

  const unitsMap: { [key: string]: Unit } = {}

  accountStates.forEach(accountState => {
    accountState.clearinghouseState.assetPositions.forEach(position => {
      const { coin } = position.position
      if (!unitsMap[coin]) {
        unitsMap[coin] = {
          base_unit_info: { asset: coin },
          positions: [],
          orders: [],
        }
      }
      unitsMap[coin].positions.push({
        public_address: accountState.user,
        info: {
          szi: position.position.szi,
          positionValue: position.position.positionValue,
          liquidationPx: position.position.liquidationPx,
        },
      })
    })

    accountState.openOrders.forEach(order => {
      if (!unitsMap[order.coin]) {
        unitsMap[order.coin] = {
          base_unit_info: { asset: order.coin },
          positions: [],
          orders: [],
        }
      }
      unitsMap[order.coin].orders.push({
        public_address: accountState.user,
        info: {
          limitPx: order.limitPx,
          origSz: order.origSz,
        },
      })
    })
  })

  return Object.values(unitsMap)
}

export const getBatchAccount = (
  account: Account,
  proxy?: Proxy,
): BatchAccount => {
  return {
    account,
    proxy,
  }
}
