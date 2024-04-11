import { RefreshOutlined } from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'
import { Box, CircularProgress } from '@mui/material'

import { Row } from '../../../components/Table'
import { Unit } from '../../../types'
import { convertMsToTime } from '../../../utils'

export const createRows = (
  units: Unit[],
  closingUnitAsset: string[],
  reCreatingUnitAssets: string[],
  getUnitTimingOpened: (asset: string) => number,
  getUnitTimingReacreate: (asset: string) => number,
  handleAction?: (
    type: 'close_unit' | 'update_unit_timing',
    unit: Unit,
  ) => void,
): Row[] => {
  return units.map(unit => ({
    id: unit.base_unit_info.asset,
    data: [
      <div>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <strong>{unit.base_unit_info.asset}</strong>
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: '2px' }}
            onClick={() =>
              handleAction && handleAction('update_unit_timing', unit)
            }
          >
            <RefreshOutlined
              sx={{ width: '18px', height: '18px', marginTop: '-2px' }}
            />
            {getUnitTimingReacreate(unit.base_unit_info.asset) / 60000} min
          </Box>
        </Box>

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

        <div>Sizes: {unit.positions.map(p => p.info.szi).join(' / ')}</div>
        <div>
          Liq price:{' '}
          {unit.positions
            .map(p => Number(p.info.liquidationPx).toFixed(5))
            .join(' / ')}
        </div>
      </div>,
      <Box sx={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
        <LoadingButton
          variant='contained'
          color='error'
          loading={
            closingUnitAsset.includes(unit.base_unit_info.asset) ||
            reCreatingUnitAssets.includes(unit.base_unit_info.asset)
          }
          onClick={() => handleAction && handleAction('close_unit', unit)}
        >
          Close Unit
        </LoadingButton>
      </Box>,
    ],
  }))
}
