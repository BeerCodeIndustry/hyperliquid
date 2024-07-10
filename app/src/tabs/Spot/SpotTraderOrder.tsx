import { Box, Typography } from '@mui/material'
import { invoke } from '@tauri-apps/api'
import { useCallback, useEffect } from 'react'
import { toast } from 'react-toastify'

import { db } from '../../context'
import { BatchAccount, SpotMeta, TraderOrder } from '../../types'

export const getAssetName = (name: string, meta: SpotMeta) => {
  return `${meta.tokens[meta.universe.find(u => u.name === name)!.tokens[0]].name}/${meta.tokens[meta.universe.find(u => u.name === name)!.tokens[1]].name}`
}

const getStatus = (status: TraderOrder['status']) => {
  if (status === 'opened') {
    return 'warning'
  }

  if (status === 'filled') {
    return 'success'
  }

  return 'error'
}

export const SpotTraderOrder = ({
  id,
  coin,
  size,
  status,
  opened_at,
  meta,
  batchAccount,
  fetchOrders,
}: TraderOrder & {
  meta: SpotMeta
  batchAccount: BatchAccount
  fetchOrders: (x: boolean) => void
}) => {
  const checkLoop = useCallback(() => {
    console.log('loop')
    invoke('check_order_and_open_counter_order', {
      batchAccount,
      oid: id,
    })
      .then(res => {
        if (res) {
          return db
            .updateTraderOrder(id, { status: 'filled' })
            .then(() => fetchOrders(true))
        }
        setTimeout(checkLoop, 500)
      })
      .catch(e => {
        toast(e, { type: 'error' })
      })
  }, [])

  useEffect(() => {
    let timeout: NodeJS.Timeout

    if (status === 'opened') {
      timeout = setTimeout(checkLoop, 3000)
    }

    return () => {
      clearTimeout(timeout)
    }
  }, [checkLoop, status])

  return (
    <Box
      sx={{
        border: '2px solid white',
        p: 1,
        m: 1,
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      <Typography>
        asset: <strong>{getAssetName(coin, meta)}</strong>
      </Typography>
      <Typography>
        size:{' '}
        <strong>
          {size}{' '}
          {
            meta.tokens[meta.universe.find(u => u.name === coin)!.tokens[0]]
              .name
          }
        </strong>
      </Typography>
      <Box display='flex' alignItems='center' gap={2}>
        <Typography>status:</Typography>
        <Typography
          sx={theme => ({ color: theme.palette[getStatus(status)].main })}
        >
          <strong>{status}</strong>
        </Typography>
      </Box>
      <Typography>
        opened at:{' '}
        <strong>
          {new Date(opened_at).toLocaleDateString()}{' '}
          {new Date(opened_at).toLocaleTimeString()}
        </strong>
      </Typography>
    </Box>
  )
}
