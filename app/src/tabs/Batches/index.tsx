import { Box, Button, Paper } from "@mui/material";
import React from "react";

import { CreateBatchModal } from "../../components/CreateBatchModal";

const Batch: React.FC = () => {
  return <Paper sx={{ width: "100%", p: 2 }}>Batch</Paper>;
};

export const Batches: React.FC = () => {
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
        <Batch />
      </Box>
    </Box>
  );
};
