import LoadingButton from '@mui/lab/LoadingButton'
import { Modal, Paper, TextField, Typography } from '@mui/material'
import { useMemo, useState } from 'react'

import Box from '@mui/material/Box'

export interface FormUnit {
  sz: number
  leverage: number
  asset: string
  timing: number
}

export const ImportUnitsModal: React.FC<{
  open: boolean
  handleClose: () => void
  handleCreateUnits: (units: FormUnit[]) => void
}> = ({ open, handleClose, handleCreateUnits }) => {
  const [form, setForm] = useState({
    text: '',
  })

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

  const onConfirm = () => {
    handleCreateUnits(units)
  }

  const onChange = (key: 'text', v: string) => {
    setForm(prev => ({ ...prev, [key]: v }))
  }

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
          <Box sx={{ width: '100%' }}>
            <Typography>Preview:</Typography>
            <Box sx={{ maxHeight: '100px', overflow: 'auto' }}>
              {units.map(unit => {
                return <Box>{JSON.stringify(unit)}</Box>
              })}
            </Box>
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
            disabled={!form.text}
          >
            Confirm
          </LoadingButton>
        </Box>
      </Paper>
    </Modal>
  )
}
