import MuiTab from '@mui/material/Tab'
import MuiTabs from '@mui/material/Tabs'
import Box from '@mui/material/Box'
import { useState } from 'react'

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Accounts, Batches, Proxy } from './tabs'

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
} as const

const App = () => {
  const [tabId, setTabId] = useState<keyof typeof Tabs>(Tabs.Accounts.id)

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <MuiTabs
          value={tabId}
          onChange={(_, newTabId) => setTabId(newTabId)}
          aria-label='basic tabs example'
        >
          {Object.values(Tabs).map(({ label, id }) => (
            <MuiTab label={label} value={id} key={id} />
          ))}
        </MuiTabs>
      </Box>
      <Box sx={{ p: 2 }}>
        {tabId === Tabs.Accounts.id && <Accounts />}
        {tabId === Tabs.Proxy.id && <Proxy />}
        {tabId === Tabs.Batches.id && <Batches />}
      </Box>
      <ToastContainer position='bottom-left'  />
    </Box>
  )
}

export default App
