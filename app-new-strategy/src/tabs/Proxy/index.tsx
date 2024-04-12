import { Box, Button } from '@mui/material'
import { useContext, useMemo, useState } from 'react'

import { AddProxyModal } from '../../components/AddProxyModal'
import { ChipWithCopy } from '../../components/ChipWithCopy'
import { Row, Table } from '../../components/Table'
import { GlobalContext } from '../../context'
import { HeadCell, Proxy as ProxyType } from '../../types'

const createRows = (proxies: ProxyType[]): Row[] => {
  return proxies.map(proxy => ({
    id: proxy.id!,
    data: [
      <ChipWithCopy value={`${proxy.host}:${proxy.port}`} />,
      <ChipWithCopy value={proxy.username} />,
      <ChipWithCopy value={proxy.password} />,
    ],
  }))
}

const headCells: HeadCell[] = [
  {
    id: 'ip_port',
    align: 'left',
    disablePadding: false,
    label: 'Host:Port',
  },
  {
    id: 'login',
    align: 'center',
    disablePadding: false,
    label: 'Username',
  },
  {
    id: 'password',
    align: 'center',
    disablePadding: false,
    label: 'Password',
  },
]

export const Proxy = () => {
  const { proxies, addProxy, removeProxies } = useContext(GlobalContext)
  const rows = useMemo(() => createRows(proxies), [proxies])
  const [activeModalId, setModalId] = useState<string | null>(null)

  const ActionBar: React.FC<{
    selected: string[]
    onActionDone: () => void
  }> = ({ selected, onActionDone }) => {
    return (
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          width: '100%',
          justifyContent: 'flex-end',
        }}
      >
        <Button
          variant='contained'
          color='error'
          onClick={() => {
            onActionDone()
            removeProxies(selected)
          }}
        >
          Delete selected
        </Button>
      </Box>
    )
  }

  const toolbar = () => {
    return (
      <div>
        <Button
          variant='contained'
          color='primary'
          onClick={() => {
            setModalId('addProxyModal')
          }}
        >
          Add proxy
        </Button>
      </div>
    )
  }

  return (
    <Box sx={{ width: '100%' }}>
      <AddProxyModal
        handleAddAccount={addProxy}
        open={activeModalId === 'addProxyModal'}
        handleClose={() => setModalId(null)}
      />
      <Table
        headCells={headCells}
        rows={rows}
        withCheckbox
        ActionBar={ActionBar}
        toolbar={toolbar()}
      />
    </Box>
  )
}
