import LoadingButton from '@mui/lab/LoadingButton'
import {
  Alert,
  CircularProgress,
  Modal,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import { invoke } from '@tauri-apps/api'
import { useEffect, useMemo, useState } from 'react'

import Box from '@mui/material/Box'

import { BatchAccount } from '../../types'

export interface FormUnit {
  sz: number
  leverage: number
  asset: string
  timing: number
}

export const ImportUnitsModal: React.FC<{
  open: boolean
  account: BatchAccount
  accountsCount: number
  handleClose: () => void
  handleCreateUnits: (units: FormUnit[]) => void
}> = ({ open, handleClose, handleCreateUnits, account, accountsCount }) => {
  const [form, setForm] = useState({
    text: '',
  })

  const [decimalsMap, setDecimalsMap] = useState<Record<string, number>>({})
  const [pricesMap, setPricesMap] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)

  const getDecimals = (asset: string): Promise<number> => {
    return invoke<number>('get_asset_sz_decimals', {
      batchAccount: account,
      asset,
    })
  }

  const getAssetPrice = (asset: string): Promise<string> => {
    return invoke<string>('get_asset_price', {
      batchAccount: account,
      asset,
    })
  }

  const units = useMemo(() => {
    const unitsStrings = form.text.split('\n')

    return unitsStrings
      .map(str => {
        const match = str.match(
          /(?<asset>.+):(?<size>.+):(?<leverage>.+):(?<timing>.+)/,
        )
        if (
          !match?.groups?.asset ||
          !match?.groups?.size ||
          !match?.groups?.leverage ||
          !match?.groups?.timing
        ) {
          return null
        }
        return {
          asset: match?.groups?.asset.toUpperCase(),
          sz: Number(match?.groups?.size),
          leverage: Number(match?.groups?.leverage),
          timing: Number(match?.groups?.timing) * 60000,
        }
      })
      .filter(e => e !== null) as FormUnit[]
  }, [form])

  const getFormatedSize = (size: number, decimals: number) => {
    return Number(size.toFixed(decimals))
  }

  useEffect(() => {
    if (!units.length) {
      return
    }
    setLoading(true)

    const decimalsPromise = Promise.all(
      units.map(unit => getDecimals(unit.asset)),
    )
      .then(res => {
        const map: Record<string, number> = {}
        res.forEach((decimal, index) => {
          map[units[index].asset] = decimal
        })
        setDecimalsMap(map)
      })
      .catch(() => {
        alert(`Error when getting size decimals`)
      })

    const pricesPromise = Promise.all(
      units.map(unit => getAssetPrice(unit.asset)),
    )
      .then(res => {
        const map: Record<string, number> = {}
        res.forEach((price, index) => {
          map[units[index].asset] = Number(price)
        })
        setPricesMap(map)
      })
      .catch(() => {
        alert(`Error when getting size decimals`)
      })

    Promise.all([decimalsPromise, pricesPromise]).finally(() => {
      setLoading(false)
    })
  }, [units])

  const onConfirm = () => {
    handleCreateUnits(
      units.map(unit => {
        return {
          ...unit,
          sz: getFormatedSize(unit.sz, decimalsMap[unit.asset]),
        }
      }),
    )
  }

  const onChange = (key: 'text', v: string) => {
    setForm(prev => ({ ...prev, [key]: v }))
  }

  const sizingError =
    accountsCount > 2
      ? units.some(
          unit => pricesMap[unit.asset] * unit.sz * unit.leverage * 0.1 < 10,
        )
      : false

  return (
    <Modal
      open={open}
      onClose={handleClose}
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Paper
        sx={{
          width: '500px',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            gap: 2,
          }}
        >
          <Box sx={{ width: '100%' }}>
            <TextField
              label='Units'
              type='text'
              size='medium'
              sx={{ width: '100%' }}
              placeholder={`asset:size:leverage:time(mins)`}
              variant='outlined'
              onChange={e => onChange('text', e.target.value)}
              multiline
            />
          </Box>
          {sizingError && (
            <Alert variant='standard' color='warning'>
              <Typography fontSize={14}>
                [Size * TokenPrice] * [Leverage] * 0.1 should be greater or
                equal than 10$
              </Typography>
            </Alert>
          )}
          <Box sx={{ width: '100%' }}>
            <Typography>Preview:</Typography>
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              <Box sx={{ maxHeight: '100px', overflow: 'auto' }}>
                {units.map(unit => {
                  return (
                    <Box>
                      {JSON.stringify({
                        ...unit,
                        sz: getFormatedSize(unit.sz, decimalsMap[unit.asset]),
                      })}
                    </Box>
                  )
                })}
              </Box>
            )}
          </Box>
        </Box>
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <LoadingButton
            variant='contained'
            color='success'
            onClick={onConfirm}
            disabled={!form.text || sizingError}
          >
            Confirm
          </LoadingButton>
        </Box>
      </Paper>
    </Modal>
  )
}
