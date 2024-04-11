import { Box, Button, Paper, Typography } from '@mui/material'
import React, { useContext, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { CreateUnitModal } from '../../components/CreateUnitModal'
import { FormUnit, ImportUnitsModal } from '../../components/ImportUnitsModal'
import { Table } from '../../components/Table'
import { UpdateUnitTimingModal } from '../../components/UpdateUnitTimingModal'
import { GlobalContext } from '../../context'
import { Unit } from '../../types'
import { getBatchAccount } from '../../utils'
import { headCells } from './components/cells'
import { createRows } from './components/rows'
import { useBatch } from './hooks/useBatch'

export const Batch: React.FC<{
  name: string
  accounts: string[]
  constant_timing: number
  id: string
}> = ({ name, accounts, id, constant_timing }) => {
  const [modalId, setModalId] = useState<string | null>(null)
  const { closeBatch, getAccountProxy } = useContext(GlobalContext)

  const [updatingUnit, setUpdatingUnit] = useState('')

  const {
    batchAccounts,
    units,
    balances,
    closingUnits,
    recreatingUnits,
    initialLoading,
    getUnitTimingOpened,
    getUnitTimingReacreate,
    setTimings,
    createUnit,
    closeUnit,
  } = useBatch({ accounts, id, name })

  const handleAction = (
    type: 'close_unit' | 'update_unit_timing',
    unit: Unit,
  ) => {
    if (type === 'close_unit') {
      closeUnit(unit)
    }

    if (type === 'update_unit_timing') {
      setUpdatingUnit(unit.base_unit_info.asset)
    }
  }

  const handleUpdateUnitTiming = (timing: number) => {
    if (!updatingUnit) {
      return
    }
    setTimings(updatingUnit, timing, getUnitTimingOpened(updatingUnit))
    setUpdatingUnit('')
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
          account={getBatchAccount(
            batchAccounts[0],
            getAccountProxy(batchAccounts[0]),
          )}
          open
          handleClose={() => setModalId(null)}
          defaultTiming={constant_timing}
        />
      )}

      {updatingUnit && (
        <UpdateUnitTimingModal
          handleUpdate={handleUpdateUnitTiming}
          open
          handleClose={() => setUpdatingUnit('')}
          defaultValue={getUnitTimingReacreate(updatingUnit) / 60000}
        />
      )}

      {modalId === 'importUnitsModal' && (
        <ImportUnitsModal
          handleCreateUnits={handleCreateUnits}
          account={getBatchAccount(
            batchAccounts[0],
            getAccountProxy(batchAccounts[0]),
          )}
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

      {batchAccounts.map((account, index) => {
        return (
          <Typography key={account.id}>
            Account {index + 1}: <strong>{account.public_address}</strong>{' '}
            balance: <strong>{balances[account.public_address]}$</strong>
          </Typography>
        )
      })}

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
