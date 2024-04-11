import {
  AppBar,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  Typography,
} from '@mui/material'
import { blue, green, red, yellow } from '@mui/material/colors'
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/ru'
import { useContext, useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { LogsContext } from '../../logsContext'

const colors = {
  DEBUG: blue[900],
  ERROR: red[900],
  INFO: green[900],
  WARN: yellow[900],
}

export const Logs = () => {
  const { logs, refetch, filters, setFilters } = useContext(LogsContext)

  const [isAutoRefresh, setIsAutoRefresh] = useState(false)

  const getLogColor = (log: string) => {
    if (log.includes('ERROR')) return colors.ERROR
    if (log.includes('WARN')) return colors.WARN
    if (log.includes('INFO')) return colors.INFO
    if (log.includes('DEBUG')) return colors.DEBUG
  }

  const handleRefreshClick = () => {
    refetch()
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isAutoRefresh) {
      interval = setInterval(refetch, 5000)
    }

    return () => {
      clearInterval(interval)
    }
  }, [isAutoRefresh])

  const onChangeStart = (v: Dayjs | null) => {
    setFilters({
      ...filters,
      start: v ?? dayjs().subtract(1, 'day'),
    })
  }

  const onChangeEnd = (v: Dayjs | null) => {
    setFilters({
      ...filters,
      end: v ?? dayjs(),
    })
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='ru'>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          position: 'relative',
        }}
      >
        <AppBar
          position='sticky'
          color='default'
          sx={{ padding: 2, mb: 2, top: 49 }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box sx={{ display: 'flex', gap: 3 }}>
              <DateTimePicker
                label='Start'
                value={filters.start}
                format='DD.MM.YYYY HH:mm'
                onChange={onChangeStart}
              />
              <DateTimePicker
                label='End'
                value={filters.end}
                format='DD.MM.YYYY HH:mm'
                onChange={onChangeEnd}
              />
            </Box>

            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isAutoRefresh}
                    onChange={e => setIsAutoRefresh(e.target.checked)}
                  />
                }
                label='Auto refresh (5s)'
              />

              <Button
                variant='contained'
                sx={{ height: '42px' }}
                onClick={handleRefreshClick}
              >
                Refresh
              </Button>
            </Box>
          </Box>
        </AppBar>
        <Box sx={{ display: 'flex', flexDirection: 'column-reverse', gap: 1 }}>
          {logs.map(info => (
            <Paper sx={{ p: 1 }} key={uuidv4()}>
              <Typography color={getLogColor(info)}>{info}</Typography>
            </Paper>
          ))}
        </Box>
      </Box>
    </LocalizationProvider>
  )
}
