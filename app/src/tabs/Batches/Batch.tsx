import { Box, Button, Paper, Typography } from '@mui/material'
import React, { useContext, useMemo, useState } from 'react'

import { CreateUnitModal } from '../../components/CreateUnitModal'
import { Table } from '../../components/Table'
import { GlobalContext } from '../../context'
import { Unit } from '../../types'
import { headCells } from './components/cells'
import { createRows } from './components/rows'
import { useBatch } from './hooks/useBatch'

export const Batch: React.FC<{
  account_id_1: string
  account_id_2: string
  constant_timing: number
  id: string
}> = ({ account_id_1, account_id_2, id, constant_timing }) => {
  const [modalId, setModalId] = useState<string | null>(null)
  const { closeBatch } = useContext(GlobalContext)

  const {
    account_1,
    account_2,
    units,
    balances,
    unitTimings,
    closingUnits,
    reCreatingUnits,
    initialLoading,
    createUnit,
    closeUnit,
  } = useBatch({ account_id_1, account_id_2, id })

  const getUnitTimingOpened = (asset: string): number => {
    return unitTimings[asset as keyof typeof unitTimings]?.openedTiming
  }

  const getUnitTimingReacreation = (asset: string): number => {
    return unitTimings[asset as keyof typeof unitTimings]?.recreateTiming
  }

  const handleAction = (type: 'close_unit', unit: Unit) => {
    if (type === 'close_unit') {
      closeUnit(unit)
    }
  }

  const handleCreateUnit = async (form: {
    asset: string
    sz: string
    leverage: string
    timing: number
  }) => {
    createUnit({
      ...form,
      sz: Number(form.sz),
      leverage: Number(form.leverage),
    })
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

  const toolbar = () => {
    return (
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant='contained'
          color='primary'
          disabled={initialLoading}
          onClick={() => setModalId('createUnitModal')}
        >
          Create Unit
        </Button>
      </Box>
    )
  }

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
            disabled={Boolean(initialLoading || units.length)}
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
        loading={initialLoading}
        rows={rows}
        pagination={false}
        toolbar={toolbar()}
      />
    </Paper>
  )
}
