import { Toolbar, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import React from 'react'

interface Props {
  numSelected: number
  children?: React.ReactNode
  toolBar?: React.ReactNode
}

export const EnhancedTableToolbar: React.FC<Props> = ({
  numSelected,
  children,
  toolBar,
}) => {
  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
        ...(numSelected > 0 && {
          bgcolor: theme =>
            alpha(
              theme.palette.primary.main,
              theme.palette.action.activatedOpacity,
            ),
        }),
      }}
    >
      {numSelected > 0 && (
        <Typography
          sx={{ flex: '1 1 100%' }}
          color='inherit'
          variant='subtitle1'
          component='div'
        >
          {numSelected} selected
        </Typography>
      )}
      {numSelected > 0 ? children : toolBar}
    </Toolbar>
  )
}
