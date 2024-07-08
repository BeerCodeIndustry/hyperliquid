import { Box, Button, Checkbox, FormControl, FormControlLabel, Paper, Typography } from '@mui/material'
import React, { useContext, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { CreateUnitModal } from '../../components/CreateUnitModal'
import { FormUnit, ImportUnitsModal } from '../../components/ImportUnitsModal'
import { Table } from '../../components/Table'
import { UpdateUnitTimingModal } from '../../components/UpdateUnitTimingModal'
import { GlobalContext, db } from '../../context'
import { Unit } from '../../types'
import { getBatchAccount } from '../../utils'
import { headCells } from './components/cells'
import { createRows } from './components/rows'
import { useBatch } from './hooks/useBatch'

export const Batch: React.FC<{
  name: string
  accounts: string[]
  smartBalanceUsage: boolean
  constant_timing: number
  id: string
}> = ({ name, accounts, id, constant_timing, smartBalanceUsage }) => {
  const [modalId, setModalId] = useState<string | null>(null)
  const { closeBatch, getAccountProxy } = useContext(GlobalContext)

  const [updatingUnit, setUpdatingUnit] = useState('')
  const [smartUsage, setSmartUsage] = useState(smartBalanceUsage)

  const {
    batchAccounts,
    units,
    balances,
    closingUnits,
    recreatingUnits,
    initialLoading,
    unitTimings,
    getUnitTimingOpened,
    getUnitTimingReacreate,
    setTimings,
    createUnit,
    closeUnit,
  } = useBatch({ accounts, id, name, smartBalanceUsage: smartUsage })

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

  const handleSmartBalanceChange = (value: boolean) => {
    db.updateBatch(id, value)
    setSmartUsage(value)
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
    [
      units,
      closingUnits,
      recreatingUnits,
      unitTimings,
      getUnitTimingOpened,
      getUnitTimingReacreate,
    ],
  )

  const toolbar = () => {
    return (
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      > 
      <FormControl size='small' >
            <FormControlLabel
              control={
                <Checkbox
                  checked={smartUsage}
                  onChange={e => handleSmartBalanceChange(e.target.checked)}
                />
              }
              label='Smart balance usage'
            />
          </FormControl>
        <Box sx={{ display: 'flex', gap: 2}}>
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
       
      </Box>
    )
  }

  return (
    <Paper sx={{ padding: 3 }}>
      {modalId === 'createUnitModal' && (
        <CreateUnitModal
          handleCreateUnit={handleCreateUnit}
          account={getBatchAccount(
            batchAccounts[0],
            getAccountProxy(batchAccounts[0]),
          )}
          accountsCount={accounts.length}
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
          accountsCount={accounts.length}
          open
          handleClose={() => setModalId(null)}
        />
      )}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 0,
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
            balance: <strong>{balances[account.public_address]?.all}$</strong>{' '}
            free_balance:{' '}
            <strong>{balances[account.public_address]?.free}$</strong>
          </Typography>
        )
      })}

      <Box sx={{ mt: 2 }}>
        <Table
          headCells={headCells}
          loading={initialLoading}
          rows={rows}
          pagination={false}
          toolbar={toolbar()}
        />
      </Box>
      
    </Paper>
  )
}
