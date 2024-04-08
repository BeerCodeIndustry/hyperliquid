import LoadingButton from '@mui/lab/LoadingButton'
import {
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Modal,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import { invoke } from '@tauri-apps/api'
import { useState } from 'react'

import Box from '@mui/material/Box'

import { BatchAccount } from '../../types'

const AllowedAssets = [
  'BTC',
  'ETH',
  'SOL',
  'DOGE',
  'FTM',
  'WIF',
  'OP',
  'kPEPE',
  'ENA',
  'MKR',
  'ARB',
  'TAO',
  'PENDLE',
  'STX',
  'NEAR',
  'INJ',
  'BNB',
  'FIL',
  'AR',
  'AVAX',
  'MATIC',
  'SEI',
  'RUNE',
  'LTC',
  'W',
  'LINK',
  'SUI',
  'RNDR',
  'BCH',
  'TIA',
  'APT',
  'ONDO',
  'ORDI',
  'WLD',
  'JUP',
  'TON',
  'LDO',
  'kBONK',
  'JTO',
  'FXS',
  'ADA',
  'AAVE',
  'kSHIB',
  'DYM',
  'DYDX',
  'STRK',
  'XRP',
  'ATOM',
  'SNX',
  'MEME',
  'BLUR',
]

export const CreateUnitModal: React.FC<{
  open: boolean
  account: BatchAccount
  handleClose: () => void
  handleCreateUnit: (form: {
    asset: string
    sz: number
    leverage: number
    timing: number
  }) => void
  defaultTiming: number
}> = ({ open, handleClose, handleCreateUnit, defaultTiming, account }) => {
  const [form, setForm] = useState({
    asset: '',
    timing: defaultTiming,
    sz: 0,
    leverage: 1,
  })

  const [assetPrice, setAssetPrice] = useState(0)
  const [assetPriceLoading, setAssetPriceLoading] = useState(false)

  const onConfirm = () => {
    if (form.asset && form.sz && form.leverage && form.timing)
      handleCreateUnit({
        ...form,
        timing: form.timing * 60000,
      })
  }

  const getAssetPrice = (asset: string): Promise<string> => {
    return invoke<string>('get_asset_price', {
      batchAccount: account,
      asset,
    })
  }

  const onChange = (
    key: 'asset' | 'sz' | 'leverage' | 'timing',
    v: string | number,
  ) => {
    if (key === 'asset' && typeof v === 'string') {
      setAssetPriceLoading(true)
      getAssetPrice(v)
        .then((price: string) => {
          setAssetPrice(Number(price))
        })
        .finally(() => {
          setAssetPriceLoading(false)
        })
    }
    setForm(prev => ({ ...prev, [key]: v }))
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Paper
        sx={{
          width: '500px',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Box>
          <FormControl fullWidth size='small'>
            <InputLabel id='asset-label'>Select Asset</InputLabel>
            <Select
              labelId='asset-label'
              id='asset-select'
              value={form.asset}
              label='Select Asset'
              onChange={e => onChange('asset', e.target.value)}
            >
              <MenuItem value=''>
                <em>No asset</em>
              </MenuItem>
              {AllowedAssets.map(a => (
                <MenuItem value={a} key={a}>
                  {a}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ display: 'flex', width: '100%', gap: 2 }}>
          <Box sx={{ width: '100%' }}>
            <TextField
              fullWidth
              size='small'
              label='Size'
              variant='outlined'
              type='number'
              onChange={e => onChange('sz', Number(e.target.value))}
            />
          </Box>
          <Box sx={{ width: '100%' }}>
            <TextField
              fullWidth
              size='small'
              label='Leverage'
              variant='outlined'
              type='number'
              onChange={e => onChange('leverage', Number(e.target.value))}
            />
          </Box>
          <Box sx={{ width: '100%' }}>
            <TextField
              label='Re-create timing (mins)'
              type='number'
              size='small'
              placeholder={String(defaultTiming)}
              defaultValue={defaultTiming}
              variant='outlined'
              onChange={e => onChange('timing', Number(e.target.value))}
            />
          </Box>
        </Box>
        <Box>
          <Typography>
            Summary:{' '}
            {assetPriceLoading ? (
              <CircularProgress size={12} />
            ) : (
              <strong>{(assetPrice * form.sz).toFixed(2)} $</strong>
            )}
          </Typography>
        </Box>
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <LoadingButton
            variant='contained'
            color='success'
            onClick={onConfirm}
            disabled={!form.asset || !form.sz || !form.leverage}
          >
            Confirm
          </LoadingButton>
        </Box>
      </Paper>
    </Modal>
  )
}
