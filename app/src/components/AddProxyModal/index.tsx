import { Button, Modal, Paper, TextField } from '@mui/material'
import { useState } from 'react'

import Box from '@mui/material/Box'

import { Proxy as ProxyType } from '../../types'

export const AddProxyModal: React.FC<{
  open: boolean
  handleClose: () => void
  handleAddAccount: (account: ProxyType) => void
}> = ({ open, handleClose, handleAddAccount }) => {
  const [proxy, setProxy] = useState<ProxyType>({
    name: '',
    host: '',
    port: '',
    username: '',
    password: '',
  })

  const onConfirm = () => {
    if (
      proxy.host &&
      proxy.port &&
      proxy.username &&
      proxy.password &&
      proxy.name
    ) {
      handleAddAccount(proxy)
      handleClose()
    }
  }

  const onChange = (key: 'name' | 'proxy', v: string) => {
    if (key === 'proxy') {
      const [host, port, username, password] = v.split(':')

      setProxy(prev => ({ ...prev, host, port, username, password }))

      return
    }

    setProxy(prev => ({ ...prev, name: v }))
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
              fullWidth
              label='Name'
              variant='outlined'
              onChange={e => onChange('name', e.target.value)}
            />
            <TextField
              fullWidth
              label='host:port:login:password'
              variant='outlined'
              onChange={e => onChange('proxy', e.target.value)}
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
                !proxy.name ||
                !proxy.host ||
                !proxy.port ||
                !proxy.username ||
                !proxy.password
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
