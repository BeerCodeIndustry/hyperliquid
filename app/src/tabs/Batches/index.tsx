import { Box, Button } from '@mui/material'
import React, { useContext } from 'react'

import { CreateBatchModal } from '../../components/CreateBatchModal'
import { GlobalContext } from '../../context'
import { Batch } from './Batch'

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
              name={batch.name}
              account_id_1={batch.account_1_id!}
              account_id_2={batch.account_2_id!}
              constant_timing={batch.constant_timing}
              id={batch.id!}
              key={batch.id}
            />
          )
        })}
      </Box>
    </Box>
  )
}
