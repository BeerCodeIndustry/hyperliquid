import { useContext, useMemo } from 'react'

import { GlobalContext } from '../../../context'
import { Account } from '../../../types'

interface Props {
  account_id_1: string
  account_id_2: string
}

interface ReturnType {
  account_1: Account
  account_2: Account
}

export const useInitBatch = ({
  account_id_1,
  account_id_2,
}: Props): ReturnType => {
  const { accounts } = useContext(GlobalContext)

  const account_1 = useMemo(
    () => accounts.find(a => a.id === account_id_1)!,
    [accounts],
  )
  const account_2 = useMemo(
    () => accounts.find(a => a.id === account_id_2)!,
    [accounts],
  )

  return { account_1, account_2 }
}
