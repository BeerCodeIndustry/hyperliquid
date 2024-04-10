import dayjs, { Dayjs } from 'dayjs'
import { createContext, useEffect, useMemo, useState } from 'react'

import { db } from './context'

interface LogsContextType {
  logs: string[]
  filters: LogFilters
  setFilters: (filters: LogFilters) => void
  refetch: () => void
}

export interface LogFilters {
  start: Dayjs
  end: Dayjs
}

export const LogsContext = createContext<LogsContextType>({
  logs: [],
  filters: {
    start: dayjs().subtract(1, 'day'),
    end: dayjs(),
  },
  refetch: () => {},
  setFilters: () => {},
})

export const LogsProvider = ({ children }: { children: React.ReactNode }) => {
  const [logs, setLogs] = useState<string[]>([])

  const [filters, setFilters] = useState<LogFilters>({
    start: dayjs().subtract(1, 'day'),
    end: dayjs().add(1, 'hour'),
  })

  const refetch = () => {
    db.getLogs(
      dayjs(filters.start.valueOf()).format('YYYY-MM-DD HH:mm:ss'),
      dayjs(filters.end.valueOf()).format('YYYY-MM-DD HH:mm:ss'),
    ).then(logs => {
      setLogs(logs?.map(log => log.text) ?? [])
    })
  }

  useEffect(() => {
    refetch()
  }, [])

  const value = useMemo(
    () => ({ logs, filters, setFilters, refetch }),
    [logs, filters],
  )

  return <LogsContext.Provider value={value}>{children}</LogsContext.Provider>
}
