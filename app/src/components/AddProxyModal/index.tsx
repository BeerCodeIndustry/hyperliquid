import { useState } from "react";

import { Box, Button, Modal, Paper, TextField } from "@mui/material";

import { Proxy as ProxyType } from "../../types";

export const AddProxyModal: React.FC<{
  open: boolean;
  handleClose: () => void;
  handleAddAccount: (account: ProxyType) => void;
}> = ({ open, handleClose, handleAddAccount }) => {
  const [proxy, setProxy] = useState<ProxyType>({
    name: "",
    ip: "",
    port: "",
    login: "",
    pass: "",
  });

  const onConfirm = () => {
    if (proxy.ip && proxy.port && proxy.login && proxy.pass && proxy.name) {
      handleAddAccount(proxy);
      handleClose();
    }
  };

  const onChange = (key: keyof ProxyType, v: string) => {
    setProxy((prev) => ({ ...prev, [key]: v }));
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
            <TextField
              label="Name"
              variant="outlined"
              onChange={(e) => onChange("name", e.target.value)}
            />
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
                gap: 2,
              }}
            >
              <TextField
                label="Ip"
                variant="outlined"
                onChange={(e) => onChange("ip", e.target.value)}
              />
              <TextField
                label="Port"
                variant="outlined"
                onChange={(e) => onChange("port", e.target.value)}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                gap: 2,
                width: "100%",
              }}
            >
              <TextField
                label="Login"
                variant="outlined"
                onChange={(e) => onChange("login", e.target.value)}
              />
              <TextField
                label="Password"
                variant="outlined"
                onChange={(e) => onChange("pass", e.target.value)}
              />
            </Box>
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
              disabled={
                !proxy.name ||
                !proxy.ip ||
                !proxy.port ||
                !proxy.login ||
                !proxy.pass
              }
            >
              Confirm
            </Button>
          </Box>
        </Box>
      </Paper>
    </Modal>
  );
};
