import { Account, AccountState, BatchAccount, Proxy, Unit } from './types'

export const stringifyProxy = (proxy: Proxy) => {
  if (!proxy) {
    return 'No proxy'
  }

  return `${proxy.host}:${proxy.port}:${proxy.username}:${proxy.password}`
}

export const parseProxy = (proxyString: string): Proxy => {
  const [host, port, username, password] = proxyString.split(':')

  return { host, port, username, password }
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
    accountState.assetPositions.forEach(position => {
      const { coin, leverage, szi } = position.position
      if (!unitsMap[coin]) {
        unitsMap[coin] = {
          base_unit_info: {
            asset: coin,
            leverage: leverage.value,
            size: 0,
          },
          positions: [],
        }
      }
      if (Number(szi) > 0) {
        unitsMap[coin].base_unit_info.size += Number(szi) / leverage.value
      }
      unitsMap[coin].positions.push({
        info: {
          szi: position.position.szi,
          positionValue: position.position.positionValue,
          leverage: position.position.leverage.value,
          liquidationPx: position.position.liquidationPx,
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

export function convertMsToTime(milliseconds: number) {
  let seconds = Math.floor(milliseconds / 1000)
  let minutes = Math.floor(seconds / 60)
  let hours = Math.floor(minutes / 60)

  function padTo2Digits(num: number) {
    return num.toString().padStart(2, '0')
  }

  seconds = seconds % 60
  minutes = minutes % 60
  hours = hours % 24

  return `${padTo2Digits(hours)}:${padTo2Digits(minutes)}:${padTo2Digits(
    seconds,
  )}`
}

export const formatLogs = (
  logs: string[],
  user_id?: string,
): { text: string; created_at?: string; user_id?: string }[] => {
  const regex = /^\[([^\]]+)\]/

  return logs.map(log => {
    const match = log.match(regex)

    if (!match) {
      return { text: log, user_id }
    }

    return { text: log, created_at: match[1], user_id }
  })
}

export const getLongPositions = (positions: Unit['positions']) => {
  return positions.filter(p => p.info.szi[0] !== '-')
}

export const getShortPositions = (positions: Unit['positions']) => {
  return positions.filter(p => p.info.szi[0] === '-')
}

export const getPositionsSummary = (positions: Unit['positions']) => {
  return positions.reduce((acc, pos) => acc + Math.abs(Number(pos.info.szi)), 0)
}

export const withTimeout = <T>(invoke: () => Promise<T>, time = 20000) => {
  return new Promise<T>((res, rej) => {
    let timeout: NodeJS.Timeout
    invoke()
      .then(response => {
        clearTimeout(timeout)
        res(response)
      })
      .catch(e => {
        clearTimeout(timeout)
        rej(e)
      })

    timeout = setTimeout(() => {
      rej('timeout ' + time)
    }, time)
  })
}
