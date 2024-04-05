import { useState } from "react";
import MuiTabs from "@mui/material/Tabs";
import MuiTab from "@mui/material/Tab";
import Box from "@mui/material/Box";

import { Accounts, Proxy, Batches } from "./tabs";

const Tabs = {
  Accounts: {
    label: "Accounts",
    id: "Accounts",
  },
  Proxy: {
    label: "Proxy",
    id: "Proxy",
  },
  Batches: {
    label: "Batches",
    id: "Batches",
  },
} as const;

const App = () => {
  const [tabId, setTabId] = useState<keyof typeof Tabs>(Tabs.Accounts.id);

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <MuiTabs
          value={tabId}
          onChange={(_, newTabId) => setTabId(newTabId)}
          aria-label="basic tabs example"
        >
          {Object.values(Tabs).map(({ label, id }) => (
            <MuiTab label={label} value={id} />
          ))}
        </MuiTabs>
      </Box>
      <Box sx={{ p: 2 }}>
        {tabId === Tabs.Accounts.id && <Accounts />}
        {tabId === Tabs.Proxy.id && <Proxy />}
        {tabId === Tabs.Batches.id && <Batches />}
      </Box>
    </Box>
  );
};

export default App;
