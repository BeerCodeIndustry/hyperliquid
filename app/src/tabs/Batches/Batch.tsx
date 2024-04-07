import { LoadingButton } from '@mui/lab'
import { Box, Button, CircularProgress, Paper, Typography } from '@mui/material'
import { invoke } from '@tauri-apps/api'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { CreateUnitModal } from '../../components/CreateUnitModal'
import { Row, Table } from '../../components/Table'
import { GlobalContext } from '../../context'
import { AccountState, HeadCell, Unit } from '../../types'
import {
  convertMsToTime,
  getBatchAccount,
  transformAccountStatesToUnits,
} from '../../utils'

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
  // {
  //   id: 'orders',
  //   align: 'center',
  //   disablePadding: false,
  //   label: <Typography>Opened limit orders</Typography>,
  // },
  {
    id: 'actions',
    align: 'center',
    disablePadding: false,
    label: <Typography>Actions</Typography>,
  },
]

const createRows = (
  units: Unit[],
  closingUnitAsset: string[],
  reCreatingUnitAssets: string[],
  getUnitTimingOpened: (asset: string) => number,
  handleAction?: (type: 'close_unit', unit: Unit) => void,
): Row[] => {
  return units.map(unit => ({
    id: unit.base_unit_info.asset,
    data: [
      <div>
        <strong>{unit.base_unit_info.asset}</strong>
        {reCreatingUnitAssets.includes(unit.base_unit_info.asset) ? (
          <div>
            Recreating <CircularProgress size={28} />
          </div>
        ) : (
          <div>
            Time opened:
            {convertMsToTime(
              Date.now() - getUnitTimingOpened(unit.base_unit_info.asset),
            )}
          </div>
        )}
      </div>,
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
      // <div>
      //   <div>Amount: {unit.orders.length}</div>
      //   <div>
      //     Sizes: {unit.orders?.[0]?.info.origSz} /{' '}
      //     {unit.orders?.[1]?.info.origSz}
      //   </div>
      //   <div>
      //     Limit px: {unit.orders?.[0]?.info.limitPx} /{' '}
      //     {unit.orders?.[1]?.info.limitPx}
      //   </div>
      // </div>,
      <Box sx={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
        <LoadingButton
          variant='contained'
          color='error'
          loading={closingUnitAsset.includes(unit.base_unit_info.asset)}
          onClick={() => handleAction && handleAction('close_unit', unit)}
        >
          Close Unit
        </LoadingButton>
      </Box>,
    ],
  }))
}

export const Batch: React.FC<{
  account_id_1: string
  account_id_2: string
  constant_timing: number
  id: string
}> = ({ account_id_1, account_id_2, id, constant_timing }) => {
  const [modalId, setModalId] = useState<string | null>(null)
  const {
    accounts,
    getAccountProxy,
    closeBatch,
    setUnitInitTimings,
    getUnitTimings,
  } = useContext(GlobalContext)

  const [unitTimings, setUnitTimings] = useState<
    Record<string, { openedTiming: number; recreateTiming: number }>
  >({})

  console.log(unitTimings)

  const [loading, setLoading] = useState(true)
  const [closingUnits, setClosingUnits] = useState<string[]>([])
  const [creatingUnits, setCreatingUnits] = useState<string[]>([])
  const [reCreatingUnits, setReCreatingUnits] = useState<string[]>([])

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

  useEffect(() => {
    getUnitTimings(id).then(timings => {
      setUnitTimings(timings)
    })
  }, [])

  const getUnitTimingOpened = (asset: string): number => {
    return unitTimings[asset as keyof typeof unitTimings]?.openedTiming
  }

  const getUnitTimingReacreation = (asset: string): number => {
    return unitTimings[asset as keyof typeof unitTimings]?.recreateTiming
  }

  useEffect(() => {
    if (
      accountStates[account_1.public_address] &&
      accountStates[account_2.public_address]
    ) {
      setLoading(false)
    }
  }, [accountStates])

  const units = useMemo(
    () => transformAccountStatesToUnits(Object.values(accountStates)),
    [accountStates],
  )

  useEffect(() => {
    units.forEach(unit => {
      const timestamp = getUnitTimingOpened(unit.base_unit_info.asset)
      if (
        (timestamp &&
          Date.now() - timestamp >=
            getUnitTimingReacreation(unit.base_unit_info.asset)) ||
        (Date.now() - timestamp >= 5000 && unit.positions.length === 1)
      ) {
        if (
          reCreatingUnits.includes(unit.base_unit_info.asset) ||
          closingUnits.includes(unit.base_unit_info.asset) ||
          creatingUnits.includes(unit.base_unit_info.asset)
        ) {
          return
        }

        setUnitTimings(prev => {
          delete prev[unit.base_unit_info.asset]
          return prev
        })
        setReCreatingUnits(prev => [...prev, unit.base_unit_info.asset])
        const promise = invoke('close_and_create_same_unit', {
          account1: getBatchAccount(account_1, getAccountProxy(account_1)),
          account2: getBatchAccount(account_2, getAccountProxy(account_2)),
          asset: unit.base_unit_info.asset,
          sz: unit.base_unit_info.size,
          leverage: unit.base_unit_info.leverage,
        }).then(async () => {
          setTimeout(async () => {
            setReCreatingUnits(prev =>
              prev.filter(asset => asset !== unit.base_unit_info.asset),
            )

            await setUnitInitTimings(
              id,
              unit.base_unit_info.asset,
              getUnitTimingReacreation(unit.base_unit_info.asset),
              Date.now(),
            )
            getUnitTimings(id).then(timings => {
              setUnitTimings(timings)
            })
          }, 5000)
        })

        toast.promise(promise, {
          pending: `Re-creating unit with asset ${unit.base_unit_info.asset}`,
          success: `Unit with asset ${unit.base_unit_info.asset} re-created 👌`,
          error: `Error while re-creating unit with asset ${unit.base_unit_info.asset} error 🤯`,
        })
      }
    })
  }, [units, reCreatingUnits, closingUnits, creatingUnits, unitTimings])

  const removeUnit = (asset: string) => {
    setAccountState(prev => ({
      [account_1.public_address]: {
        ...prev[account_1.public_address],
        clearinghouseState: {
          ...prev[account_1.public_address].clearinghouseState,
          assetPositions: prev[
            account_1.public_address
          ].clearinghouseState.assetPositions.filter(
            pos => pos.position.coin !== asset,
          ),
        },
      },
      [account_2.public_address]: {
        ...prev[account_2.public_address],
        clearinghouseState: {
          ...prev[account_2.public_address].clearinghouseState,
          assetPositions: prev[
            account_2.public_address
          ].clearinghouseState.assetPositions.filter(
            pos => pos.position.coin !== asset,
          ),
        },
      },
    }))
  }

  const handleAction = (type: 'close_unit', unit: Unit) => {
    if (type === 'close_unit') {
      setClosingUnits(prev => [...prev, unit.base_unit_info.asset])
      invoke('close_unit', {
        account1: getBatchAccount(account_1, getAccountProxy(account_1)),
        account2: getBatchAccount(account_2, getAccountProxy(account_2)),
        asset: unit.base_unit_info.asset,
      }).then(() => {
        setTimeout(() => {
          removeUnit(unit.base_unit_info.asset)
          setClosingUnits(prev =>
            prev.filter(asset => asset !== unit.base_unit_info.asset),
          )
        }, 6000)
      })
    }
  }

  const rows = useMemo(
    () =>
      createRows(
        units,
        closingUnits,
        reCreatingUnits,
        getUnitTimingOpened,
        handleAction,
      ),
    [units, closingUnits, reCreatingUnits],
  )

  const handleCreateUnit = async (form: {
    asset: string
    sz: number
    leverage: number
    timing: number
  }) => {
    setCreatingUnits(prev => [...prev, form.asset])
    const promise = invoke('create_unit', {
      account1: getBatchAccount(account_1, getAccountProxy(account_1)),
      account2: getBatchAccount(account_2, getAccountProxy(account_2)),
      asset: form.asset,
      sz: Number(form.sz),
      leverage: Number(form.leverage),
    }).then(async () => {
      setCreatingUnits(prev => prev.filter(asset => asset !== form.asset))
      await setUnitInitTimings(id, form.asset, form.timing, Date.now())
      await getUnitTimings(id).then(timings => {
        setUnitTimings(timings)
      })
    })
    toast.promise(promise, {
      pending: `Creating unit with asset ${form.asset}`,
      success: `Unit with asset ${form.asset} created 👌`,
      error: `Error while creating unit with asset ${form.asset} error 🤯`,
    })
    setModalId(null)
  }

  const toolbar = () => {
    return (
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant='contained'
          color='primary'
          disabled={loading}
          onClick={() => setModalId('createUnitModal')}
        >
          Create Unit
        </Button>
      </Box>
    )
  }

  useEffect(() => {
    const connect = (conId: '1' | '2') => {
      const con = new WebSocket('wss://api.hyperliquid.xyz/ws')
      const account = conId === '1' ? account_1 : account_2

      con.onopen = () => {
        setSockets(prev => ({ ...prev, [account.public_address]: con }))
      }

      con.onclose = () => {
        setSockets(prev => ({ ...prev, [account.public_address]: null }))
        connect(conId)
      }

      con.onerror = () => {
        con.close()
      }
    }

    connect('1')
    connect('2')
  }, [])

  const handleData = (
    accountState1: AccountState,
    accountState2: AccountState,
  ) => {
    setAccountState({
      [account_2.public_address]: accountState2,
      [account_1.public_address]: accountState1,
    })
    setBalances({
      [account_2.public_address]:
        accountState2.clearinghouseState.marginSummary.accountValue,
      [account_1.public_address]:
        accountState1.clearinghouseState.marginSummary.accountValue,
    })
  }

  useEffect(() => {
    if (socket_2 && socket_1) {
      socket_2.send(
        JSON.stringify({
          method: 'subscribe',
          subscription: { type: 'webData2', user: account_2.public_address },
        }),
      )
      socket_1.send(
        JSON.stringify({
          method: 'subscribe',
          subscription: { type: 'webData2', user: account_1.public_address },
        }),
      )

      let state: AccountState | null = null

      socket_2.onmessage = (ev: MessageEvent<any>) => {
        const data = JSON.parse(ev.data)
        if (data?.channel === 'webData2') {
          const accountState = data.data as AccountState
          if (!state) {
            state = accountState
            return
          }

          if (state) {
            handleData(state, accountState)
            state = null
          }
        }
      }

      socket_1.onmessage = (ev: MessageEvent<any>) => {
        const data = JSON.parse(ev.data)
        if (data?.channel === 'webData2') {
          const accountState = data.data as AccountState
          if (!state) {
            state = accountState
            return
          }

          if (state) {
            handleData(accountState, state)
            state = null
          }
        }
      }
    }
  }, [socket_2, socket_1])

  return (
    <Paper sx={{ width: '100%', p: 2 }}>
      <CreateUnitModal
        handleCreateUnit={handleCreateUnit}
        open={modalId === 'createUnitModal'}
        handleClose={() => setModalId(null)}
        defaultTiming={constant_timing}
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
            disabled={Boolean(loading || units.length)}
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
        loading={loading}
        rows={rows}
        pagination={false}
        toolbar={toolbar()}
      />
    </Paper>
  )
}
