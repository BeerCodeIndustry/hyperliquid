import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Modal,
  OutlinedInput,
  Paper,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material'
import { useContext, useMemo, useState } from 'react'

import Box from '@mui/material/Box'

import { GlobalContext, db } from '../../context'
import { Trader } from '../../types'

export const CreateTraderModal: React.FC<{
  open: boolean
  handleClose: () => void
  fetchTraders: () => void
  traders: Trader[]
}> = ({ open, handleClose, traders, fetchTraders }) => {
  const { accounts } = useContext(GlobalContext)
  const [trader, setTrader] = useState<Trader>({
    name: '',
    public_address: '',
  })

  const filteredAccounts = useMemo(() => {
    const allTraders = traders.map(b => b.public_address).flat()

    return accounts.filter(a => !allTraders.includes(a.public_address))
  }, [accounts, traders])

  const onConfirm = () => {
    db.createTrader(trader).then(() => {
      fetchTraders()
      handleClose()
    })
  }
  const onChange = (id: 'name' | 'size' | 'coin', v: string | number) => {
    setTrader(prev => ({ ...prev, [id]: v ?? '' }))
  }

  const onAccountsChange = (v: SelectChangeEvent<string>) => {
    setTrader({
      ...trader,
      public_address: v.target.value,
    })
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <TextField
                label='Name'
                type='text'
                variant='outlined'
                onChange={e => onChange('name', e.target.value)}
              />
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id='demo-multiple-chip-label'>Accounts</InputLabel>
              <Select
                labelId='demo-multiple-chip-label'
                value={trader.public_address ?? undefined}
                onChange={onAccountsChange}
                input={
                  <OutlinedInput id='select-multiple-chip' label='Accounts' />
                }
              >
                {filteredAccounts.map(account => (
                  <MenuItem
                    key={account.public_address}
                    value={account.public_address}
                  >
                    {account.public_address}
                  </MenuItem>
                ))}

                {!filteredAccounts.length && (
                  <Typography sx={{ p: 1 }}>No available accounts</Typography>
                )}
              </Select>
            </FormControl>
          </Box>

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
              disabled={!trader.public_address || !trader.name}
            >
              Confirm
            </Button>
          </Box>
        </Box>
      </Paper>
    </Modal>
  )
}
