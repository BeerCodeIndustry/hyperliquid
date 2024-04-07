import { AccountState } from '../../types'

const initSocketSubUserData = (socket: WebSocket, public_address: string) => {
  const type = 'webData2'

  socket.send(
    JSON.stringify({
      method: 'subscribe',
      subscription: { type, user: public_address },
    }),
  )

  socket.onmessage = (ev: MessageEvent<any>) => {
    const data = JSON.parse(ev.data)
    if (data?.channel === type) {
      const accountState = data.data as AccountState
    }
  }
}
