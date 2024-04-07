import { useContext, useMemo } from 'react'

import { GlobalContext } from '../../context'
import { useInitBatch } from './hooks/useInitBatch'

interface Props {
  account_id_1: string
  account_id_2: string
  batch_id: string
}

export const NewBatch: React.FC<Props> = ({
  account_id_1,
  account_id_2,
  batch_id,
}) => {
  const { account_1, account_2 } = useInitBatch({ account_id_1, account_id_2 })

  return <div>123</div>
}
