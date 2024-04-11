import { ThemeProvider, createTheme } from '@mui/material'
import ReactDOM from 'react-dom/client'

import App from './App'
import { GlobalProvider } from './context'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <GlobalProvider>
    <ThemeProvider theme={createTheme()}>
      <App />
    </ThemeProvider>
  </GlobalProvider>,
)
