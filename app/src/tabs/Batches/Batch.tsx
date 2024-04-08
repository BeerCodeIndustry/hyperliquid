import { Box, Button, Paper, Typography } from '@mui/material'
import React, { useContext, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { CreateUnitModal } from '../../components/CreateUnitModal'
import { FormUnit, ImportUnitsModal } from '../../components/ImportUnitsModal'
import { Table } from '../../components/Table'
import { GlobalContext } from '../../context'
import { Unit } from '../../types'
import { getBatchAccount } from '../../utils'
import { headCells } from './components/cells'
import { createRows } from './components/rows'
import { useBatch } from './hooks/useBatch'

export const Batch: React.FC<{
  name: string
  account_id_1: string
  account_id_2: string
  constant_timing: number
  id: string
}> = ({ name, account_id_1, account_id_2, id, constant_timing }) => {
  const [modalId, setModalId] = useState<string | null>(null)
  const { closeBatch, getAccountProxy } = useContext(GlobalContext)

  const {
    account_1,
    account_2,
    units,
    balances,
    closingUnits,
    recreatingUnits,
    initialLoading,
    getUnitTimingOpened,
    getUnitTimingReacreate,
    createUnit,
    closeUnit,
  } = useBatch({ account_id_1, account_id_2, id, name })

  const handleAction = (type: 'close_unit', unit: Unit) => {
    if (type === 'close_unit') {
      closeUnit(unit)
    }
  }

  const handleCreateUnit = async (form: {
    asset: string
    sz: number
    leverage: number
    timing: number
  }) => {
    setModalId(null)
    const promise = createUnit(form)

    toast.promise(promise, {
      pending: `${name}: Creating unit with asset ${form.asset}`,
      success: `${name}: Unit with asset ${form.asset} created 👌`,
      error: `${name}: Error while creating unit with asset ${form.asset} error 🤯`,
    })
  }

  const handleCreateUnits = async (units: FormUnit[]) => {
    setModalId(null)

    units.forEach(unit => {
      const promise = createUnit(unit)

      toast.promise(promise, {
        pending: `${name}: Creating unit with asset ${unit.asset}`,
        success: `${name}: Unit with asset ${unit.asset} created 👌`,
        error: `${name}: Error while creating unit with asset ${unit.asset} error 🤯`,
      })
    })
  }

  const rows = useMemo(
    () =>
      createRows(
        units,
        closingUnits,
        recreatingUnits,
        getUnitTimingOpened,
        getUnitTimingReacreate,
        handleAction,
      ),
    [units, closingUnits, recreatingUnits],
  )

  const toolbar = () => {
    return (
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '16px',
        }}
      >
        <Button
          variant='outlined'
          color='primary'
          disabled={initialLoading}
          onClick={() => setModalId('importUnitsModal')}
        >
          Import units
        </Button>
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
      {modalId === 'createUnitModal' && (
        <CreateUnitModal
          handleCreateUnit={handleCreateUnit}
          account={getBatchAccount(account_1, getAccountProxy(account_1))}
          open
          handleClose={() => setModalId(null)}
          defaultTiming={constant_timing}
        />
      )}

      {modalId === 'importUnitsModal' && (
        <ImportUnitsModal
          handleCreateUnits={handleCreateUnits}
          open
          handleClose={() => setModalId(null)}
        />
      )}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          justifyContent: 'space-between',
        }}
      >
        <Typography fontSize={36} fontWeight={900} sx={{ m: '12px 0' }}>
          {name}
        </Typography>
        <Box>
          <Button
            variant='contained'
            color='error'
            onClick={() => closeBatch(id)}
            disabled={Boolean(
              initialLoading || units.length || recreatingUnits.length,
            )}
          >
            Close Batch
          </Button>
        </Box>
      </Box>

      <Typography>
        Account 1: <strong>{account_1.public_address}</strong> balance:{' '}
        <strong>{balances[account_1.public_address]}$</strong>
      </Typography>
      <Typography>
        Account 2: <strong>{account_2.public_address}</strong> balance:{' '}
        <strong>{balances[account_2.public_address]}$</strong>
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
