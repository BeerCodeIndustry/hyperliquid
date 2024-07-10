import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Modal,
  Paper,
  Select,
  TextField,
} from '@mui/material'
import { invoke } from '@tauri-apps/api'
import { useState } from 'react'
import { toast } from 'react-toastify'

import Box from '@mui/material/Box'

import { db } from '../../context'
import { BatchAccount, SpotMeta } from '../../types'

export const CreateTraderOrderModal: React.FC<{
  open: boolean
  handleClose: () => void
  fetchOrders: () => void
  batchAccount: BatchAccount
  meta: SpotMeta
}> = ({ open, handleClose, meta, fetchOrders, batchAccount }) => {
  const [order, setOrder] = useState<{ size: number; coin: string }>({
    size: 0,
    coin: '',
  })

  const openOrder = () => {
    return invoke<number>('open_spot_order', {
      batchAccount,
      bid: {
        asset: order.coin,
        sz: order.size,
        is_buy: true,
      },
    }).catch(e => {
      toast(e, { type: 'error' })
    })
  }

  const onConfirm = async () => {
    const id = await openOrder()
    if (id) {
      db.createTraderOrder({
        id,
        ...order,
        opened_at: Date.now(),
        trader_id: batchAccount.account.public_address,
        status: 'opened',
      }).then(() => {
        fetchOrders()
        handleClose()
      })
    }
  }
  const onChange = (id: 'size' | 'coin', v: string | number) => {
    setOrder(prev => ({ ...prev, [id]: v ?? '' }))
  }

  const decimals = order.coin

  const tokenName = order.coin
    ? meta.tokens[meta.universe.find(a => a.name === order.coin)!.tokens[0]]
        .name
    : null

  const getStep = () => {
    if (!order.coin) {
      return undefined
    }
    const decimals =
      meta.tokens[meta.universe.find(a => a.name === order.coin)!.tokens[0]]
        .szDecimals

    if (decimals === 0 || decimals === undefined) {
      return '1'
    }

    return `.${new Array(decimals - 1).fill('0').join('')}1`
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby='modal-modal-title'
      aria-describedby='modal-modal-description'
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Paper sx={{ width: '500px', p: 2 }}>
        <Box sx={{ gap: 5, display: 'flex', flexDirection: 'column' }}>
          <FormControl fullWidth>
            <InputLabel id='asset-label'>Select Asset</InputLabel>
            <Select
              labelId='asset-label'
              id='asset-select'
              value={order.coin}
              label='Select asset pare'
              onChange={e => onChange('coin', e.target.value)}
            >
              <MenuItem value=''>
                <em>No asset pare</em>
              </MenuItem>
              {meta.universe.map(({ tokens, name }) => (
                <MenuItem value={name} key={name}>
                  {`${meta.tokens[tokens[0]].name}/${meta.tokens[tokens[1]].name}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ width: '100%' }}>
            <TextField
              fullWidth
              key={order.coin}
              label={`Size ${tokenName ? `(${tokenName})` : ''}`}
              variant='outlined'
              inputProps={{
                step: getStep(),
              }}
              value={order.size}
              disabled={decimals === undefined}
              type='number'
              onChange={e => onChange('size', Number(e.target.value))}
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', width: '100%', gap: 2, mt: 4 }}>
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <Button variant='contained' color='error' onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant='contained'
              color='success'
              onClick={onConfirm}
              disabled={!order.coin || !order.size}
            >
              Confirm
            </Button>
          </Box>
        </Box>
      </Paper>
    </Modal>
  )
}
