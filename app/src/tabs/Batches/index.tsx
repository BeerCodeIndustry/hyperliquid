
import React, { useContext, useEffect, useMemo, useState } from "react";

import { CreateBatchModal } from "../../components/CreateBatchModal";
import { GlobalContext } from "../../context";
import { HeadCell, Order, Position } from "../../types";
import { Row, Table } from "../../components/Table";

import { Button, Paper, Tooltip, Box, Typography } from "@mui/material";
import HelpIcon from '@mui/icons-material/Help';
import { dataDir } from "@tauri-apps/api/path";

const createRows = (
  positions: Record<string, Position[]>,
  account_1_public: string,
  account_2_public: string,
  orders: Record<string, Order[]>,
  assets: string[]
): Row[] => {
  return assets.map(asset => {
    const assetPositions = positions.filter(p => p.position.asset === asset);
    return {
      id: asset,
      data: [
        asset,
        `${positions[account_1_public]}`,
        ``,
        asset,
        asset,
      ],
    }
  })
}

const headCells: HeadCell[] = [
  {
    id: "asset",
    align: "left",
    disablePadding: false,
    label: <Typography>Asset</Typography>,
  },
  {
    id: "positions_size",
    align: "center",
    disablePadding: false,
    label: <Typography>Positions sizes</Typography>,
  },
  {
    id: "orders_size",
    align: "center",
    disablePadding: false,
    label: <Typography>Orders sizes</Typography>,
  },
  {
    id: "positions",
    align: "center",
    disablePadding: false,
    label: <Typography>Positions ratio <Tooltip title='ACCOUNT1_POSITIONS / ACCOUNT2_POSITIONS' placement="top"><HelpIcon /></Tooltip></Typography>,
  },
  {
    id: "orders",
    align: "center",
    disablePadding: false,
    label: <Typography>Orders ratio <Tooltip title='ACCOUNT1_ORDERS / ACCOUNT2_ORDERS' placement="top"><HelpIcon /></Tooltip></Typography>,
  },
];

const Batch: React.FC<{account_id_1: string, account_id_2: string, id: string}> = ({account_id_1, account_id_2, id}) => {
  const { socket, accounts } = useContext(GlobalContext);

  const account_1 = accounts.find(({id}) => id === account_id_1)!
  const account_2 = accounts.find(({id}) => id === account_id_2)!

  const [positions, setPositions] = useState<Record<string, Position[]>>({})
  const [balances, setBalances] = useState<Record<string, string>>({})
  const [orders, setOrders] = useState<Record<string, Order[]>>({})

  useEffect(() => {
    if (socket) {
      socket.send(JSON.stringify({ "method": "subscribe", "subscription": { "type": "webData2", "user": account_1.public_address }}))
      socket.send(JSON.stringify({ "method": "subscribe", "subscription": { "type": "webData2", "user": account_2.public_address }}))

      socket.onmessage = (ev: MessageEvent<any>) => {
        setPositions(prev => ({
          ...prev,
          [ev.data.user]: ev.data.clearinghouseState.assetPositions
        }))

        setOrders(prev => ({
          ...prev,
          [ev.data.user]: ev.data.openOrders
        }))

        setBalances(prev => ({
          ...prev,
          [ev.data.user]: ev.data.clearinghouseState.marginSummary.accountValue
        }))
      }
    }
  }, [socket])

  const rows = useMemo(() => {
    const allPositions = [...positions[account_1.public_address], ...positions[account_2.public_address]]
    const allOrders = [...orders[account_1.public_address], ...orders[account_2.public_address]]

    const assets = Array.from(new Set([...allPositions.map(p => p.position.coin), ...allOrders.map(p => p.coin)]))
    return createRows(positions, orders, assets)
  }, [positions, orders])

  return <Paper sx={{ width: "100%", p: 2 }}>
      <Typography>ID: <strong>{id}</strong></Typography>
      <Typography>Account 1 public_address: <strong>{account_1.public_address}</strong> balance: {balances[account_1.public_address]}$</Typography>
      <Typography>Account 2 public_address: <strong>{account_2.public_address}</strong> balance: {balances[account_2.public_address]}$</Typography>
      <Table 
        headCells={headCells}
        rows={rows}
        pagination={false}
      />
    </Paper>;
};

export const Batches: React.FC = () => {
  const { batches } = useContext(GlobalContext);

  const [modalId, setModalId] = React.useState<string | null>(null);

  return (
    <Box sx={{ width: "100%" }}>
      <CreateBatchModal
        open={modalId === "createBatchModal"}
        handleClose={() => setModalId(null)}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={() => setModalId("createBatchModal")}
      >
        Create Batch
      </Button>
      <Box sx={{ width: "100%", mt: 2 }}>
        {batches.map((batch) => {
          return <Batch account_id_1={batch.account_1_id!} account_id_2={batch.account_2_id!} id={batch.id!} key={batch.id} />
        })}
      </Box>
    </Box>
  );
};
