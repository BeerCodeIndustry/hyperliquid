import { Typography } from '@mui/material'

import { HeadCell } from '../../../types'

export const headCells: HeadCell[] = [
  {
    id: 'asset',
    align: 'left',
    disablePadding: false,
    label: <Typography>Asset</Typography>,
  },
  {
    id: 'positions',
    align: 'center',
    disablePadding: false,
    label: <Typography>Opened positions</Typography>,
  },
  {
    id: 'actions',
    align: 'center',
    disablePadding: false,
    label: <Typography>Actions</Typography>,
  },
]
