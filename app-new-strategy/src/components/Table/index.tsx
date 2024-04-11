import {
  Checkbox,
  CircularProgress,
  Table as MuiTable,
  Paper,
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  TableRow,
} from '@mui/material'
import React from 'react'

import { HeadCell } from '../../types'
import { EnhancedTableHead } from '../EnhancedTableHead'
import { EnhancedTableToolbar } from '../EnhancedTableToolbar'

export interface Row {
  id: string
  data: any[]
}

interface Props {
  headCells: HeadCell[]
  ActionBar?: React.FC<{ selected: string[] }>
  toolbar?: React.ReactNode
  withCheckbox?: boolean
  pagination?: boolean
  loading?: boolean
  rows: Row[]
}

export const Table: React.FC<Props> = ({
  headCells,
  ActionBar,
  toolbar,
  withCheckbox,
  pagination = true,
  loading,
  rows,
}) => {
  const [selected, setSelected] = React.useState<string[]>([])
  const [page, setPage] = React.useState(0)
  const [rowsPerPage, setRowsPerPage] = React.useState(25)

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = rows.map(n => n.id)
      setSelected(newSelected)
      return
    }
    setSelected([])
  }

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleClick = (_: React.MouseEvent<unknown>, id: string) => {
    if (!withCheckbox) return
    const selectedIndex = selected.indexOf(id)
    let newSelected: string[] = []

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id)
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1))
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1))
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      )
    }
    setSelected(newSelected)
  }

  const isSelected = (id: string) => selected.indexOf(id) !== -1

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage)
  }

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0

  const visibleRows = React.useMemo(
    () => rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [page, rowsPerPage, rows],
  )

  return (
    <Paper sx={{ width: '100%', mb: 2 }}>
      <EnhancedTableToolbar numSelected={selected.length} toolBar={toolbar}>
        {ActionBar && <ActionBar selected={selected} />}
      </EnhancedTableToolbar>
      <TableContainer>
        <MuiTable
          sx={{ minWidth: 750 }}
          aria-labelledby='tableTitle'
          size='medium'
        >
          <EnhancedTableHead
            headCells={headCells}
            numSelected={selected.length}
            onSelectAllClick={handleSelectAllClick}
            rowCount={rows.length}
            withCheckbox={withCheckbox}
          />
          {!loading ? (
            <TableBody>
              {visibleRows.map((row, index) => {
                const isItemSelected = isSelected(row.id)
                const labelId = `enhanced-table-checkbox-${index}`

                return (
                  <TableRow
                    hover
                    onClick={event => handleClick(event, row.id)}
                    role='checkbox'
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={row.id}
                    selected={isItemSelected}
                    sx={{ cursor: 'pointer' }}
                  >
                    {withCheckbox && (
                      <TableCell padding='checkbox'>
                        <Checkbox
                          color='primary'
                          checked={isItemSelected}
                          inputProps={{
                            'aria-labelledby': labelId,
                          }}
                        />
                      </TableCell>
                    )}
                    {row.data.map((cell, cellIdx) => {
                      if (cellIdx === 0) {
                        return (
                          <TableCell
                            key={labelId}
                            component='th'
                            id={labelId}
                            scope='row'
                            padding={withCheckbox ? 'none' : 'normal'}
                            align='left'
                          >
                            {cell}
                          </TableCell>
                        )
                      }

                      return (
                        <TableCell key={cellIdx} align='center'>
                          {cell}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })}
              {emptyRows > 0 && (
                <TableRow
                  style={{
                    height: 53 * emptyRows,
                  }}
                >
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
          ) : (
            <CircularProgress size={20} />
          )}
        </MuiTable>
      </TableContainer>
      {pagination && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component='div'
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
    </Paper>
  )
}
