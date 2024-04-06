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

const AllowedAssets = ['JUP', 'MATIC', 'AVAX']

export const CreateUnitModal: React.FC<{
  open: boolean
  handleClose: () => void
  handleCreateUnit: (form: {
    asset: string
    sz: number
    leverage: number
  }) => void
}> = ({ open, handleClose, handleCreateUnit }) => {
  const [form, setForm] = useState({
    asset: '',
    sz: 0,
    leverage: 1,
  })

  const onConfirm = () => {
    if (form.asset && form.sz && form.leverage) handleCreateUnit(form)
  }

  const onChange = (key: 'asset' | 'sz' | 'leverage', v: string | number) => {
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
                <MenuItem value={a}>{a}</MenuItem>
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
