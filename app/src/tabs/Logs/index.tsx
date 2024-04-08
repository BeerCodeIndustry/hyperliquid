import { Box, Typography } from '@mui/material'
import { blue, green, red, yellow } from '@mui/material/colors'
import { useContext, useEffect, useRef } from 'react'

import { LogsContext } from '../../logsContext'

const colors = {
  DEBUG: blue[900],
  ERROR: red[900],
  INFO: green[900],
  WARN: yellow[900],
}

export const Logs = () => {
  const { logs } = useContext(LogsContext)

  const lastLogRef = useRef<HTMLSpanElement>(null)
  const getLogColor = (log: string) => {
    if (log.includes('ERROR')) return colors.ERROR
    if (log.includes('WARN')) return colors.WARN
    if (log.includes('INFO')) return colors.INFO
    if (log.includes('DEBUG')) return colors.DEBUG
  }

  useEffect(() => {
    lastLogRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {logs.map((info, index) => (
        <Typography
          color={getLogColor(info)}
          ref={index === logs.length - 1 ? lastLogRef : null}
        >
          {info}
        </Typography>
      ))}
    </Box>
  )
}
