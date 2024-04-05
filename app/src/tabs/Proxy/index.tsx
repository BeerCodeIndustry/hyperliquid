import DeleteIcon from '@mui/icons-material/Delete'
import { Box, Button, IconButton, Tooltip } from '@mui/material'
import { useContext, useMemo, useState } from 'react'

import { AddProxyModal } from '../../components/AddProxyModal'
import { Row, Table } from '../../components/Table'
import { GlobalContext } from '../../context'
import { HeadCell, Proxy as ProxyType } from '../../types'

const createRows = (proxies: ProxyType[]): Row[] => {
  return proxies.map(proxy => ({
    id: proxy.id!,
    data: [
      proxy.name,
      `${proxy.host}:${proxy.port}`,
      proxy.username,
      proxy.password,
    ],
  }))
}

const headCells: HeadCell[] = [
  {
    id: 'name',
    align: 'left',
    disablePadding: true,
    label: 'Name',
  },
  {
    id: 'ip_port',
    align: 'center',
    disablePadding: false,
    label: 'Ip:Port',
  },
  {
    id: 'login',
    align: 'center',
    disablePadding: false,
    label: 'Login',
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

  const ActionBar: React.FC<{ selected: string[] }> = ({ selected }) => {
    return (
      <div>
        <Tooltip title='Delete' onClick={() => removeProxies(selected)}>
          <IconButton>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </div>
    )
  }

  const toolbar = () => {
    return (
      <div>
        <Button
          variant='contained'
          color='primary'
          onClick={() => setModalId('addProxyModal')}
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
