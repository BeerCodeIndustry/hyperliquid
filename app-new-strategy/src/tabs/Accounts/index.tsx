import DeleteIcon from '@mui/icons-material/Delete'
import { Box, Button, IconButton, Tooltip } from '@mui/material'
import React, { useContext, useMemo, useState } from 'react'

import { AddAccountModal } from '../../components/AddAccountModal'
import { ChipWithCopy } from '../../components/ChipWithCopy'
import { SetProxyModal } from '../../components/SetProxyModal'
import { Row, Table } from '../../components/Table'
import { GlobalContext } from '../../context'
import { Account, HeadCell, Proxy } from '../../types'
import { stringifyProxy } from '../../utils'

const createRows = (
  accounts: Account[],
  getAccountProxy: (account: Account) => Proxy | undefined,
): Row[] => {
  return accounts.map(account => ({
    id: account.id!,
    data: [
      account.name,
      <ChipWithCopy value={account.public_address} />,
      <ChipWithCopy value={account.api_private_key} />,
      stringifyProxy(getAccountProxy(account)!),
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
    id: 'public_address',
    align: 'center',
    disablePadding: false,
    label: 'Public Address',
  },
  {
    id: 'api_private_key',
    align: 'center',
    disablePadding: false,
    label: 'Api private key',
  },
  {
    id: 'proxy',
    align: 'center',
    disablePadding: false,
    label: 'Proxy',
  },
]

export const Accounts = () => {
  const { accounts, addAccount, getAccountProxy, removeAccounts } =
    useContext(GlobalContext)
  const rows = useMemo(() => createRows(accounts, getAccountProxy), [accounts])
  const [activeModalId, setModalId] = useState<string | null>(null)

  const ActionBar: React.FC<{ selected: string[] }> = ({ selected }) => {
    return (
      <>
        <SetProxyModal
          selected={selected}
          open={activeModalId === 'setProxyModal'}
          handleClose={() => setModalId(null)}
        />
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
            color='primary'
            onClick={() => setModalId('setProxyModal')}
          >
            Set Proxy
          </Button>
          <Button
            variant='contained'
            color='error'
            onClick={() => removeAccounts(selected)}
          >
            Delete selected
          </Button>
        </Box>
      </>
    )
  }

  const toolbar = () => {
    return (
      <div>
        <Button
          variant='contained'
          color='primary'
          onClick={() => setModalId('addAccountModal')}
        >
          Add Account
        </Button>
      </div>
    )
  }

  return (
    <Box sx={{ width: '100%' }}>
      <AddAccountModal
        handleAddAccount={addAccount}
        open={activeModalId === 'addAccountModal'}
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
