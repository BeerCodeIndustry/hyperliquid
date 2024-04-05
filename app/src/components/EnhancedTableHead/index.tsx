import { Checkbox, TableCell, TableHead, TableRow } from "@mui/material";
import { HeadCell } from "../../types";

interface EnhancedTableHeadProps {
  numSelected: number;
  onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
  rowCount: number;
  withCheckbox?: boolean;
  headCells: HeadCell[];
}

export const EnhancedTableHead: React.FC<EnhancedTableHeadProps> = ({
  numSelected,
  onSelectAllClick,
  rowCount,
  withCheckbox,
  headCells,
}) => {
  return (
    <TableHead>
      <TableRow>
        {withCheckbox && (
          <TableCell padding="checkbox">
            <Checkbox
              color="primary"
              indeterminate={numSelected > 0 && numSelected < rowCount}
              checked={rowCount > 0 && numSelected === rowCount}
              onChange={onSelectAllClick}
              inputProps={{
                "aria-label": "select all desserts",
              }}
            />
          </TableCell>
        )}
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.align}
            padding={headCell.disablePadding ? "none" : "normal"}
          >
            {headCell.label}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
};
