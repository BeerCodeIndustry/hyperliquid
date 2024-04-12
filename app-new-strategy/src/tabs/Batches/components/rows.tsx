import { RefreshOutlined } from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'
import { Box, CircularProgress, Tooltip, Typography } from '@mui/material'

import { Row } from '../../../components/Table'
import { Unit } from '../../../types'
import {
  convertMsToTime,
  getLongPositions,
  getPositionsSummary,
  getShortPositions,
} from '../../../utils'

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
        <Box>Amount: {unit.positions.length}</Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Typography fontSize={14}>Sizes:</Typography>

          <Tooltip
            title={getLongPositions(unit.positions).map(pos => (
              <Box>{Math.abs(Number(pos.info.szi))}</Box>
            ))}
          >
            <Typography fontSize={14} fontWeight={900} color='green'>
              {getPositionsSummary(getLongPositions(unit.positions))}
            </Typography>
          </Tooltip>

          <span>/</span>
          <Tooltip
            title={getShortPositions(unit.positions).map(pos => (
              <Box>{Math.abs(Number(pos.info.szi))}</Box>
            ))}
          >
            <Typography fontSize={14} fontWeight={900} color='error'>
              {getPositionsSummary(getShortPositions(unit.positions))}
            </Typography>
          </Tooltip>
        </Box>
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
