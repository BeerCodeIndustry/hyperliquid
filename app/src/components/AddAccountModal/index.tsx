import { Box, Button, Modal, Paper, TextField } from '@mui/material'
import { useState } from 'react'

import { Account } from '../../types'

export const AddAccountModal: React.FC<{
  open: boolean
  handleClose: () => void
  handleAddAccount: (account: Account) => void
}> = ({ open, handleClose, handleAddAccount }) => {
  const [account, setAccount] = useState<Account>({
    name: '',
    public_address: '',
    api_private_key: '',
  })

  const onConfirm = () => {
    if (account.api_private_key && account.public_address) {
      handleAddAccount(account)
      handleClose()
    }
  }

  const onChange = (key: keyof Account, v: string) => {
    setAccount(prev => ({ ...prev, [key]: v }))
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
            <TextField
              label='Name'
              variant='outlined'
              onChange={e => onChange('name', e.target.value)}
            />
            <TextField
              label='Public address'
              variant='outlined'
              onChange={e => onChange('public_address', e.target.value)}
            />
            <TextField
              label='Api private key'
              variant='outlined'
              onChange={e => onChange('api_private_key', e.target.value)}
            />
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
              disabled={
                !account.public_address ||
                !account.api_private_key ||
                !account.name
              }
            >
              Confirm
            </Button>
          </Box>
        </Box>
      </Paper>
    </Modal>
  )
}
