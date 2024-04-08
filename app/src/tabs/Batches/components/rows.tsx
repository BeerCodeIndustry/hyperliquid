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
