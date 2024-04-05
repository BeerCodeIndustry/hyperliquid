import { useContext, useMemo, useState } from "react";
import { Box, IconButton, Tooltip, Button } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

import { Table, Row } from "../../components/Table";
import { AddProxyModal } from "../../components/AddProxyModal";
import { Proxy as ProxyType, HeadCell } from "../../types";
import { GlobalContext } from "../../context";

const createRows = (proxies: ProxyType[]): Row[] => {
  return proxies.map((proxy) => ({
    id: proxy.id!,
    data: [proxy.name, `${proxy.host}:${proxy.port}`, proxy.username, proxy.password],
  }));
};

const headCells: HeadCell[] = [
  {
    id: "name",
    align: "left",
    disablePadding: true,
    label: "Name",
  },
  {
    id: "ip_port",
    align: "center",
    disablePadding: false,
    label: "Ip:Port",
  },
  {
    id: "login",
    align: "center",
    disablePadding: false,
    label: "Login",
  },
  {
    id: "password",
    align: "center",
    disablePadding: false,
    label: "Password",
  },
];

export const Proxy = () => {
  const { proxies, addProxy, removeProxies } = useContext(GlobalContext);
  const rows = useMemo(() => createRows(proxies), [proxies]);
  const [activeModalId, setModalId] = useState<string | null>(null);

  const ActionBar: React.FC<{ selected: string[] }> = ({ selected }) => {
    return (
      <div>
        <Tooltip title="Delete" onClick={() => removeProxies(selected)}>
          <IconButton>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </div>
    );
  };

  const toolbar = () => {
    return (
      <div>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setModalId("addProxyModal")}
        >
          Add proxy
        </Button>
      </div>
    );
  };

  return (
    <Box sx={{ width: "100%" }}>
      <AddProxyModal
        handleAddAccount={addProxy}
        open={activeModalId === "addProxyModal"}
        handleClose={() => setModalId(null)}
      />
      <Table
        headCells={headCells}
        rows={rows}
        withCheckbox
        ActionBar={ActionBar}
        toolbar={toolbar()}
      />
    </Box>
  );
};
