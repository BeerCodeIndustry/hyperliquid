import { Box, Button, CircularProgress } from '@mui/material'
import { invoke } from '@tauri-apps/api'
import { useContext, useEffect, useState } from 'react'

import { CreateTraderModal } from '../../components/CreateTraderModal'
import { GlobalContext, db } from '../../context'
import { SpotMeta, Trader } from '../../types'
import { getBatchAccount } from '../../utils'
import { SpotTrader } from './SpotTrader'

export const Spot = () => {
  const [modalOpen, setModalOpen] = useState(false)
  const { accounts, proxies, getAccountProxy } = useContext(GlobalContext)

  const [meta, setMeta] = useState<SpotMeta>()

  const [traders, setTraders] = useState<Trader[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTraders = () => {
    return db.getTraders().then(res => {
      setTraders(res)
    })
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([
      invoke<SpotMeta>('get_spot_assets_meta', {
        batchAccount: getBatchAccount(accounts[0], proxies[0]),
      }).then(setMeta),
      fetchTraders(),
    ]).finally(() => {
      setLoading(false)
    })
  }, [])

  return (
    <Box sx={{ width: '100%' }}>
      {modalOpen && meta && (
        <CreateTraderModal
          fetchTraders={fetchTraders}
          open={true}
          handleClose={() => setModalOpen(false)}
          traders={traders}
        />
      )}
      <Button
        variant='contained'
        color='primary'
        onClick={() => setModalOpen(true)}
        disabled={loading}
      >
        Create Trader
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
        {loading && <CircularProgress />}
        {!loading &&
          meta &&
          traders.map(trader => {
            const account = accounts.find(
              acc => acc.public_address === trader.public_address,
            )!
            return (
              <SpotTrader
                {...trader}
                meta={meta}
                batchAccount={getBatchAccount(
                  account,
                  getAccountProxy(account),
                )}
                fetchTraders={fetchTraders}
              />
            )
          })}
      </Box>
    </Box>
  )
}
