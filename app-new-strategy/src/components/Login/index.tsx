import { LoadingButton } from '@mui/lab'
import { FormHelperText, Paper, TextField, Typography } from '@mui/material'
import { useContext, useState } from 'react'

import Box from '@mui/material/Box'

import { GlobalContext } from '../../context'

export const Login = () => {
  const { login } = useContext(GlobalContext)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onConfirm = () => {
    setLoading(true)

    login(email, password)
      .catch(e => {
        alert(e)
        setError(e)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper
        sx={{
          padding: '42px 24px',
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
          gap: '32px',
          width: '360px',
        }}
      >
        <Typography fontSize={24} fontWeight={900}>
          Login with email and password
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            width: '100%',
          }}
        >
          <TextField
            fullWidth
            type='email'
            label='Email'
            variant='outlined'
            onChange={e => setEmail(e.target.value)}
          />
          <TextField
            fullWidth
            type='password'
            label='Password'
            variant='outlined'
            onChange={e => setPassword(e.target.value)}
          />
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            width: '100%',
          }}
        >
          {error && (
            <FormHelperText error sx={{ fontSize: '16px' }}>
              {error}
            </FormHelperText>
          )}

          <LoadingButton
            variant='contained'
            color='success'
            size='large'
            onClick={onConfirm}
            loading={loading}
            disabled={!email || !password}
          >
            Login
          </LoadingButton>
        </Box>
      </Paper>
    </Box>
  )
}
