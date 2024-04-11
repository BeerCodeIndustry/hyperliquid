import {
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Modal,
  OutlinedInput,
  Paper,
  Select,
  SelectChangeEvent,
  TextField,
} from '@mui/material'
import { useContext, useMemo, useState } from 'react'

import Box from '@mui/material/Box'

import { GlobalContext } from '../../context'

const MenuProps = {
  PaperProps: {
    style: {
      width: 250,
    },
  },
}

export const CreateBatchModal: React.FC<{
  open: boolean
  handleClose: () => void
}> = ({ open, handleClose }) => {
  const { accounts, createBatch, batches } = useContext(GlobalContext)
  const [batchAccounts, setBatchAccounts] = useState<{
    name: string
    accounts: string[]
    timing: number
  }>({
    name: '',
    accounts: [],
    timing: 60,
  })

  const filteredAccounts = useMemo(() => {
    const allBatches = batches.map(b => b.accounts).flat()

    return accounts.filter(a => !allBatches.includes(a.id!))
  }, [accounts, batches])
  console.log(accounts, filteredAccounts)

  const onConfirm = () => {
    console.log(batchAccounts)
    if (batchAccounts.accounts.length === 4) {
      createBatch(batchAccounts)
      handleClose()
    }
  }

  const onChange = (id: 'timing' | 'name', v: string | number) => {
    setBatchAccounts(prev => ({ ...prev, [id]: v ?? '' }))
  }

  const onAccountsChange = (v: SelectChangeEvent<string[]>) => {
    setBatchAccounts({
      ...batchAccounts,
      accounts: Array.from(v.target.value),
    })
    console.log(v)
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
            <FormControl sx={{ m: 1, minWidth: 120 }}>
              <TextField
                label='Name'
                type='text'
                variant='outlined'
                onChange={e => onChange('name', e.target.value)}
              />
            </FormControl>
            <FormControl sx={{ m: 1, minWidth: 120 }}>
              <InputLabel id='demo-multiple-chip-label'>Accounts</InputLabel>
              <Select
                labelId='demo-multiple-chip-label'
                multiple
                value={batchAccounts.accounts}
                onChange={onAccountsChange}
                input={
                  <OutlinedInput id='select-multiple-chip' label='Accounts' />
                }
                renderValue={selected => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map(value => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
                MenuProps={MenuProps}
              >
                {filteredAccounts.map(account => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.public_address}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ m: 1, minWidth: 120 }}>
              <TextField
                label='Default unit re-create timing (mins)'
                type='number'
                placeholder='60'
                variant='outlined'
                onChange={e => onChange('timing', Number(e.target.value))}
              />
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
              disabled={batchAccounts.accounts.length !== 4}
            >
              Confirm
            </Button>
          </Box>
        </Box>
      </Paper>
    </Modal>
  )
}
