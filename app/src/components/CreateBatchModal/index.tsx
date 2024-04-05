import { useContext, useState } from "react";

import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Modal,
  Paper,
  Select,
  TextField,
} from "@mui/material";

import { Account, Proxy as ProxyType } from "../../types";
import { GlobalContext } from "../../context";

export const CreateBatchModal: React.FC<{
  open: boolean;
  handleClose: () => void;
}> = ({ open, handleClose }) => {
  const { accounts, initBatch } = useContext(GlobalContext);
  const [batchAccounts, setBatchAccounts] = useState<{
    account_1: Account | null;
    account_2: Account | null;
  }>({
    account_1: null,
    account_2: null,
  });

  const onConfirm = () => {
    if (batchAccounts.account_1 && batchAccounts.account_2) {
      initBatch(batchAccounts as { account_1: Account; account_2: Account });
      handleClose();
    }
  };

  const onChange = (id: "account_1" | "account_2", v: string) => {
    const acc = accounts.find((a) => a.public_address === v);

    setBatchAccounts((prev) => ({ ...prev, [id]: acc ?? null }));
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <Paper sx={{ width: "500px", p: 2 }}>
        <Box sx={{ gap: 5, display: "flex", flexDirection: "column" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <FormControl sx={{ m: 1, minWidth: 120 }}>
              <InputLabel id="account-label">Account 1</InputLabel>
              <Select
                labelId="account-label"
                id="account-select"
                value={batchAccounts.account_1?.public_address}
                label="Account 1"
                onChange={(e) => onChange("account_1", e.target.value)}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {accounts
                  .filter(
                    (a) =>
                      a.public_address !==
                      batchAccounts.account_2?.public_address
                  )
                  .map((a) => (
                    <MenuItem value={a.public_address}>
                      {a.public_address}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <FormControl sx={{ m: 1, minWidth: 120 }}>
              <InputLabel id="account-label">Account 2</InputLabel>
              <Select
                labelId="account-label"
                id="account-select"
                value={batchAccounts.account_2?.public_address}
                label="Account 2"
                onChange={(e) => onChange("account_2", e.target.value)}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {accounts
                  .filter(
                    (a) =>
                      a.public_address !==
                      batchAccounts.account_1?.public_address
                  )
                  .map((a) => (
                    <MenuItem value={a.public_address}>
                      {a.public_address}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Box>

          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Button variant="contained" color="error" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={onConfirm}
              disabled={!batchAccounts.account_1 || !batchAccounts.account_2}
            >
              Confirm
            </Button>
          </Box>
        </Box>
      </Paper>
    </Modal>
  );
};
