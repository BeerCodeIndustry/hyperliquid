import { Button } from '@mui/material'
import MuiTab from '@mui/material/Tab'
import MuiTabs from '@mui/material/Tabs'
import { useContext, useState } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import Box from '@mui/material/Box'

import { Login } from './components/Login'
import { ThemeSwitch } from './components/ThemeSwitch'
import { GlobalContext } from './context'
import { LogsProvider } from './logsContext'
import { Accounts, Logs, Proxy } from './tabs'
import { Theme, ThemeContext } from './themeContext'
import { Spot } from './tabs/Spot'

const Tabs = {
  Accounts: {
    label: 'Accounts',
    id: 'Accounts',
  },
  Proxy: {
    label: 'Proxy',
    id: 'Proxy',
  },
  Spot: {
    label: 'Spot trading',
    id: 'Spot',
  },
  Logs: {
    label: 'Logs',
    id: 'Logs',
  },
} as const

const App = () => {
  const { changeTheme, theme } = useContext(ThemeContext)
  const { isAuth, logout } = useContext(GlobalContext)
  const [tabId, setTabId] = useState<string>(
    localStorage.getItem('lastTabId') ?? Tabs.Accounts.id,
  )

  if (!isAuth) {
    return <Login />
  }

  return (
    <Box
      sx={theme => ({
        minHeight: '100vh',
        height: '100%',
        background: theme.palette.background.default,
      })}
    >
      <Box
        sx={theme => ({
          borderBottom: 1,
          zIndex: 999,
          position: 'sticky',
          background: theme.palette.background.default,
          top: 0,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        })}
      >
        <MuiTabs
          value={tabId}
          onChange={(_, newTabId) => {
            localStorage.setItem('lastTabId', newTabId)
            setTabId(newTabId)
          }}
          sx={theme => ({ background: theme.palette.background.default })}
          aria-label='basic tabs example'
        >
          {Object.values(Tabs).map(({ label, id }) => (
            <MuiTab label={label} value={id} key={id} />
          ))}
        </MuiTabs>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <ThemeSwitch
            onChange={e =>
              changeTheme(e.target.checked ? Theme.Dark : Theme.Light)
            }
            checked={theme === Theme.Dark}
          />
          <Button
            sx={{ mr: 2, height: '32px' }}
            color='error'
            variant='contained'
            size='small'
            onClick={logout}
          >
            Logout
          </Button>
        </Box>
      </Box>
      <Box sx={{ p: 2 }}>
        <div style={{ display: tabId === Tabs.Accounts.id ? 'block' : 'none' }}>
          <Accounts />
        </div>
        <div style={{ display: tabId === Tabs.Proxy.id ? 'block' : 'none' }}>
          <Proxy />
        </div>
        <div style={{ display: tabId === Tabs.Spot.id ? 'block' : 'none' }}>
          <Spot />
        </div>
        <LogsProvider>{tabId === Tabs.Logs.id && <Logs />}</LogsProvider>
      </Box>
      <ToastContainer position='bottom-left' pauseOnFocusLoss={false} autoClose={3000} />
    </Box>
  )
}

export default App
