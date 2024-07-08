import { CopyAllOutlined } from '@mui/icons-material'
import { Chip } from '@mui/material'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { toast } from 'react-toastify'

export const ChipWithCopy = ({ value }: { value: string }) => {
  const handleCopy = (text: string) => {
    toast(`Copied: ${text}`, { type: 'success' })
  }

  return (
    <div onClick={e => e.stopPropagation()}>
      <CopyToClipboard text={value} onCopy={handleCopy}>
        <Chip label={value} variant='outlined' icon={<CopyAllOutlined />} />
      </CopyToClipboard>
    </div>
  )
}
