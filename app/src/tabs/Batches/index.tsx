import { Box, Button, Paper, Typography } from '@mui/material'
import { invoke } from '@tauri-apps/api'
import React, { useContext, useEffect, useMemo, useState } from 'react'

import { CreateBatchModal } from '../../components/CreateBatchModal'
import { CreateUnitModal } from '../../components/CreateUnitModal'
import { Row, Table } from '../../components/Table'
import { GlobalContext } from '../../context'
import { AccountState, HeadCell, Unit } from '../../types'
import { getBatchAccount, transformAccountStatesToUnits } from '../../utils'

const createRows = (
  units: Unit[],
  handleAction?: (type: 'close_unit', unit: Unit) => void,
): Row[] => {
  return units.map(unit => ({
    id: unit.base_unit_info.asset,
    data: [
      unit.base_unit_info.asset,
      <div>
        <div>Amount: {unit.positions.length}</div>
        <div>
          Sizes: {unit.positions?.[0]?.info.szi} /{' '}
          {unit.positions?.[1]?.info.szi}
        </div>
        <div>
          Liq price: {unit.positions?.[0]?.info.liquidationPx} /{' '}
          {unit.positions?.[1]?.info.liquidationPx}
        </div>
      </div>,
      <div>
        <div>Amount: {unit.orders.length}</div>
        <div>
          Sizes: {unit.orders?.[0]?.info.origSz} /{' '}
          {unit.orders?.[1]?.info.origSz}
        </div>
        <div>
          Limit px: {unit.orders?.[0]?.info.limitPx} /{' '}
          {unit.orders?.[1]?.info.limitPx}
        </div>
      </div>,
      <Box sx={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
        <Button
          variant='contained'
          color='error'
          onClick={() => handleAction && handleAction('close_unit', unit)}
        >
          Close Unit
        </Button>
      </Box>,
    ],
  }))
}

const headCells: HeadCell[] = [
  {
    id: 'asset',
    align: 'left',
    disablePadding: false,
    label: <Typography>Asset</Typography>,
  },
  {
    id: 'positions',
    align: 'center',
    disablePadding: false,
    label: <Typography>Opened positions</Typography>,
  },
  {
    id: 'orders',
    align: 'center',
    disablePadding: false,
    label: <Typography>Opened limit orders</Typography>,
  },
  {
    id: 'actions',
    align: 'center',
    disablePadding: false,
    label: <Typography>Actions</Typography>,
  },
]

const Batch: React.FC<{
  account_id_1: string
  account_id_2: string
  id: string
}> = ({ account_id_1, account_id_2, id }) => {
  const [modalId, setModalId] = useState<string | null>(null)
  const { accounts, getAccountProxy, closeBatch } = useContext(GlobalContext)

  const account_1 = accounts.find(({ id }) => id === account_id_1)!
  const account_2 = accounts.find(({ id }) => id === account_id_2)!

  const [balances, setBalances] = useState<Record<string, string>>({})

  const [accountStates, setAccountState] = useState<
    Record<string, AccountState>
  >({})

  const [sockets, setSockets] = useState<Record<string, WebSocket | null>>({
    [account_1.public_address]: null,
    [account_2.public_address]: null,
  })

  const [socket_1, socket_2] = useMemo(
    () => [
      sockets[account_1.public_address],
      sockets[account_2.public_address],
    ],
    [sockets],
  )

  const units = useMemo(
    () => transformAccountStatesToUnits(Object.values(accountStates)),
    [accountStates],
  )

  const handleAction = (type: 'close_unit', unit: Unit) => {
    if (type === 'close_unit') {
      invoke('close_unit', {
        account1: getBatchAccount(account_1, getAccountProxy(account_1)),
        account2: getBatchAccount(account_2, getAccountProxy(account_2)),
        asset: unit.base_unit_info.asset,
      })
    }
  }

  const rows = useMemo(() => createRows(units, handleAction), [units])

  const handleCreateUnit = (form: {
    asset: string
    sz: number
    leverage: number
  }) => {
    invoke('create_unit', {
      account1: getBatchAccount(account_1, getAccountProxy(account_1)),
      account2: getBatchAccount(account_2, getAccountProxy(account_2)),
      asset: form.asset,
      sz: Number(form.sz),
      leverage: Number(form.leverage),
    })
  }

  const toolbar = () => {
    return (
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant='contained'
          color='primary'
          onClick={() => setModalId('createUnitModal')}
        >
          Create Unit
        </Button>
      </Box>
    )
  }

  useEffect(() => {
    const con_1 = new WebSocket('wss://api.hyperliquid.xyz/ws')
    const con_2 = new WebSocket('wss://api.hyperliquid.xyz/ws')

    con_1.onopen = () => {
      setSockets(prev => ({ ...prev, [account_1.public_address]: con_1 }))
    }

    con_2.onopen = () => {
      setSockets(prev => ({ ...prev, [account_2.public_address]: con_2 }))
    }
  }, [])

  useEffect(() => {
    if (socket_2) {
      socket_2.send(
        JSON.stringify({
          method: 'subscribe',
          subscription: { type: 'webData2', user: account_2.public_address },
        }),
      )

      socket_2.onmessage = (ev: MessageEvent<any>) => {
        const data = JSON.parse(ev.data)
        if (data?.channel === 'webData2') {
          const accountState = data.data as AccountState
          setAccountState(prev => ({
            ...prev,
            [account_2.public_address]: accountState,
          }))
          setBalances(prev => ({
            ...prev,
            [account_2.public_address]:
              accountState.clearinghouseState.marginSummary.accountValue,
          }))
        }
      }
    }
  }, [socket_2])

  useEffect(() => {
    if (socket_1) {
      socket_1.send(
        JSON.stringify({
          method: 'subscribe',
          subscription: { type: 'webData2', user: account_1.public_address },
        }),
      )
      socket_1.onmessage = (ev: MessageEvent<any>) => {
        const data = JSON.parse(ev.data)
        if (data?.channel === 'webData2') {
          const accountState = data.data as AccountState
          setAccountState(prev => ({
            ...prev,
            [account_1.public_address]: accountState,
          }))
          setBalances(prev => ({
            ...prev,
            [account_1.public_address]:
              accountState.clearinghouseState.marginSummary.accountValue,
          }))
        }
      }
    }
  }, [socket_1])

  return (
    <Paper sx={{ width: '100%', p: 2 }}>
      <CreateUnitModal
        handleCreateUnit={handleCreateUnit}
        open={modalId === 'createUnitModal'}
        handleClose={() => setModalId(null)}
      />
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          justifyContent: 'space-between',
        }}
      >
        <Typography>
          Batch ID: <strong>{id}</strong>
        </Typography>
        <Box>
          <Button
            variant='contained'
            color='error'
            onClick={() => closeBatch(id)}
            // disabled={!form.asset || !form.sz || !form.leverage}
          >
            Close Batch
          </Button>
        </Box>
      </Box>

      <Typography>
        Account 1 public_address: <strong>{account_1.public_address}</strong>{' '}
        balance: {balances[account_1.public_address]}$
      </Typography>
      <Typography>
        Account 2 public_address: <strong>{account_2.public_address}</strong>{' '}
        balance: {balances[account_2.public_address]}$
      </Typography>
      <Table
        headCells={headCells}
        rows={rows}
        pagination={false}
        toolbar={toolbar()}
      />
    </Paper>
  )
}

export const Batches: React.FC = () => {
  const { batches } = useContext(GlobalContext)

  const [modalId, setModalId] = React.useState<string | null>(null)

  return (
    <Box sx={{ width: '100%' }}>
      <CreateBatchModal
        open={modalId === 'createBatchModal'}
        handleClose={() => setModalId(null)}
      />
      <Button
        variant='contained'
        color='primary'
        onClick={() => setModalId('createBatchModal')}
      >
        Create Batch
      </Button>
      <Box
        sx={{
          width: '100%',
          mt: 2,
          gap: 5,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {batches.map(batch => {
          return (
            <Batch
              account_id_1={batch.account_1_id!}
              account_id_2={batch.account_2_id!}
              id={batch.id!}
              key={batch.id}
            />
          )
        })}
      </Box>
    </Box>
  )
}
