import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Paper,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

import { CreateTraderOrderModal } from '../../components/CreateTraderOrderModal'
import { db } from '../../context'
import { BatchAccount, SpotMeta, Trader, TraderOrder } from '../../types'
import { SpotTraderOrder } from './SpotTraderOrder'

export const SpotTrader = ({
  name,
  public_address,
  fetchTraders,
  batchAccount,
  meta,
}: Trader & {
  fetchTraders: () => void
  batchAccount: BatchAccount
  meta: SpotMeta
}) => {
  const [onlyOpened, setOnlyOpened] = useState(true)
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [orders, setOrders] = useState<TraderOrder[]>([])
  const [loading, setLoading] = useState(false)
  const removeTrader = () => {
    db.removeTrader(public_address)
      .then(() => {
        fetchTraders()
      })
      .catch(e => {
        toast(e, { type: 'error' })
      })
  }

  const fetchOrders = (noLoading = false) => {
    if (!noLoading) {
      setLoading(true)
    }

    db.getTraderOrders(public_address)
      .then(setOrders)
      .catch(e => {
        toast(e, { type: 'error' })
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  return (
    <Paper sx={{ padding: 3 }}>
      {orderModalOpen && (
        <CreateTraderOrderModal
          open={true}
          handleClose={() => setOrderModalOpen(false)}
          meta={meta}
          batchAccount={batchAccount}
          fetchOrders={fetchOrders}
        />
      )}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 0,
          width: '100%',
          justifyContent: 'space-between',
        }}
      >
        <Typography fontSize={36} fontWeight={900} sx={{ m: '12px 0' }}>
          {name}
        </Typography>
        <Box sx={{ gap: 4, display: 'flex' }}>
          <Button
            variant='contained'
            onClick={() => setOrderModalOpen(true)}
            disabled={false}
          >
            Open order
          </Button>
          <Button
            variant='contained'
            color='error'
            onClick={removeTrader}
            disabled={false}
          >
            Remove trader
          </Button>
        </Box>
      </Box>

      <Typography>
        public address: <strong>{public_address}</strong>
      </Typography>

      <Box display='flex' justifyContent='space-between' alignItems='center'>
        <Typography fontSize={24} fontWeight={900}>
          ORDERS (last 30):
        </Typography>

        <FormControlLabel
          control={
            <Checkbox
              checked={onlyOpened}
              onChange={() => setOnlyOpened(!onlyOpened)}
            />
          }
          label='Show only opened'
        />
      </Box>

      <Box sx={{ maxHeight: '216px', overflowY: 'auto' }}>
        {loading ? (
          <CircularProgress />
        ) : (
          orders
            .filter(order => (onlyOpened ? order.status === 'opened' : true))
            .map(order => {
              return (
                <SpotTraderOrder
                  {...order}
                  meta={meta}
                  fetchOrders={fetchOrders}
                  batchAccount={batchAccount}
                />
              )
            })
        )}
      </Box>
    </Paper>
  )
}
