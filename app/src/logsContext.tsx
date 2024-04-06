import { invoke } from '@tauri-apps/api'
import { createContext, useEffect, useMemo, useState } from 'react'

interface LogsContextType {
  logs: string[]
}

export const LogsContext = createContext<LogsContextType>({
  logs: [],
})

export const LogsProvider = ({ children }: { children: React.ReactNode }) => {
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    let id = setInterval(() => {
      invoke('get_logs').then(logs => setLogs(logs as string[]))
    }, 1000)

    return () => {
      clearInterval(id)
    }
  })

  const value = useMemo(() => ({ logs }), [logs])

  return <LogsContext.Provider value={value}>{children}</LogsContext.Provider>
}
