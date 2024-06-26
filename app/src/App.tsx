import { Button } from '@mui/material'
import MuiTab from '@mui/material/Tab'
import MuiTabs from '@mui/material/Tabs'
import { useContext, useState } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import Box from '@mui/material/Box'

import { Login } from './components/Login'
import { GlobalContext } from './context'
import { LogsProvider } from './logsContext'
import { Accounts, Batches, Logs, Proxy } from './tabs'

const Tabs = {
  Accounts: {
    label: 'Accounts',
    id: 'Accounts',
  },
  Proxy: {
    label: 'Proxy',
    id: 'Proxy',
  },
  Batches: {
    label: 'Batches',
    id: 'Batches',
  },
  Logs: {
    label: 'Logs',
    id: 'Logs',
  },
} as const

const App = () => {
  const { isAuth, logout } = useContext(GlobalContext)
  const [tabId, setTabId] = useState<string>(
    localStorage.getItem('lastTabId') ?? Tabs.Accounts.id,
  )

  if (!isAuth) {
    return <Login />
  }

  return (
    <Box>
      <Box
        sx={{
          borderBottom: 1,
          zIndex: 999,
          background: 'white',
          position: 'sticky',
          top: 0,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <MuiTabs
          value={tabId}
          onChange={(_, newTabId) => {
            localStorage.setItem('lastTabId', newTabId)
            setTabId(newTabId)
          }}
          aria-label='basic tabs example'
        >
          {Object.values(Tabs).map(({ label, id }) => (
            <MuiTab label={label} value={id} key={id} />
          ))}
        </MuiTabs>
        <Button
          sx={{ mr: 2, height: '40px' }}
          color='error'
          variant='contained'
          size='small'
          onClick={logout}
        >
          Logout
        </Button>
      </Box>
      <Box sx={{ p: 2 }}>
        {tabId === Tabs.Accounts.id && <Accounts />}
        {tabId === Tabs.Proxy.id && <Proxy />}
        <div style={{ display: tabId === Tabs.Batches.id ? 'block' : 'none' }}>
          <Batches />
        </div>
        <LogsProvider>{tabId === Tabs.Logs.id && <Logs />}</LogsProvider>
      </Box>
      <ToastContainer position='bottom-left' />
    </Box>
  )
}

export default App
