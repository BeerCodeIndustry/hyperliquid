import LoadingButton from '@mui/lab/LoadingButton'
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Modal,
  Paper,
  Select,
  TextField,
} from '@mui/material'
import { useState } from 'react'

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
  handleClose: () => void
  handleCreateUnit: (form: {
    asset: string
    sz: number
    leverage: number
    timing: number
  }) => void
  defaultTiming: number
}> = ({ open, handleClose, handleCreateUnit, defaultTiming }) => {
  const [form, setForm] = useState({
    asset: '',
    timing: defaultTiming,
    sz: 0,
    leverage: 1,
  })

  const onConfirm = () => {
    if (form.asset && form.sz && form.leverage && form.timing)
      handleCreateUnit(form)
  }

  const onChange = (
    key: 'asset' | 'sz' | 'leverage' | 'timing',
    v: string | number,
  ) => {
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
              onChange={e => onChange('sz', e.target.value)}
            />
          </Box>
          <Box sx={{ width: '100%' }}>
            <TextField
              fullWidth
              size='small'
              label='Leverage'
              variant='outlined'
              type='number'
              onChange={e => onChange('leverage', e.target.value)}
            />
          </Box>
          <Box sx={{ width: '100%' }}>
            <TextField
              label='Unit re-create timing (ms)'
              type='number'
              placeholder={String(defaultTiming)}
              defaultValue={defaultTiming}
              variant='outlined'
              onChange={e => onChange('timing', Number(e.target.value))}
            />
          </Box>
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
