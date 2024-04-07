import { invoke } from '@tauri-apps/api'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { GlobalContext } from '../../../context'
import { Account, AccountState, Unit } from '../../../types'
import { getBatchAccount, transformAccountStatesToUnits } from '../../../utils'

interface Props {
  account_id_1: string
  account_id_2: string
  id: string
}

interface CreateUnitPayload {
  asset: string
  sz: number
  leverage: number
  timing: number
}

interface ReturnType {
  account_1: Account
  account_2: Account
  units: Unit[]
  balances: Record<string, string>
  unitTimings: Record<string, { openedTiming: number; recreateTiming: number }>
  closingUnits: string[]
  reCreatingUnits: string[]
  initialLoading: boolean
  createUnit: (payload: CreateUnitPayload) => Promise<void>
  closeUnit: (unit: Unit) => Promise<void>
}

export const useBatch = ({
  account_id_1,
  account_id_2,
  id,
}: Props): ReturnType => {
  const { accounts, getAccountProxy, getUnitTimings, setUnitInitTimings } =
    useContext(GlobalContext)

  const account_1 = useMemo(
    () => accounts.find(a => a.id === account_id_1)!,
    [accounts],
  )
  const account_2 = useMemo(
    () => accounts.find(a => a.id === account_id_2)!,
    [accounts],
  )

  const [initialLoading, setInitialLoading] = useState(true)

  const [closingUnits, setClosingUnits] = useState<string[]>([])
  const [creatingUnits, setCreatingUnits] = useState<string[]>([])
  const [reCreatingUnits, setReCreatingUnits] = useState<string[]>([])

  const [balances, setBalances] = useState<Record<string, string>>({})

  const [accountStates, setAccountState] = useState<
    Record<string, AccountState>
  >({})

  const [unitTimings, setUnitTimings] = useState<
    Record<string, { openedTiming: number; recreateTiming: number }>
  >({})

  const units = useMemo(() => {
    return transformAccountStatesToUnits(Object.values(accountStates))
  }, [accountStates])

  const fetchUserStates = useCallback(() => {
    return invoke<[AccountState, AccountState]>('get_unit_user_states', {
      account1: getBatchAccount(account_1, getAccountProxy(account_1)),
      account2: getBatchAccount(account_2, getAccountProxy(account_2)),
    }).then((res: [AccountState, AccountState]) => {
      console.log(res)
      setAccountState({
        [account_1.public_address]: res[0],
        [account_2.public_address]: res[1],
      })
      setBalances({
        [account_1.public_address]: res[0].marginSummary.accountValue,
        [account_2.public_address]: res[1].marginSummary.accountValue,
      })
    })
  }, [])

  useEffect(() => {
    fetchUserStates().then(() => {
      setInitialLoading(false)
    })

    getUnitTimings(id).then(res => {
      setUnitTimings(res)
    })
  }, [])

  const createUnit = useCallback(
    ({ asset, sz, leverage, timing }: CreateUnitPayload) => {
      setCreatingUnits(prev => [...prev, asset])

      const promise = invoke('create_unit', {
        account1: getBatchAccount(account_1, getAccountProxy(account_1)),
        account2: getBatchAccount(account_2, getAccountProxy(account_2)),
        asset,
        sz,
        leverage,
      }).then(async () => {
        setCreatingUnits(prev => prev.filter(coin => coin !== asset))
        await setUnitInitTimings(id, asset, timing, Date.now())
        getUnitTimings(id).then(timings => {
          setUnitTimings(timings)
        })
        fetchUserStates()
      })

      toast.promise(promise, {
        pending: `${id} Creating unit with asset ${asset}`,
        success: `${id} Unit with asset ${asset} created 👌`,
        error: `${id} Error while creating unit with asset ${asset} error 🤯`,
      })

      return promise
    },
    [],
  )

  const closeUnit = useCallback((unit: Unit) => {
    setClosingUnits(prev => [...prev, unit.base_unit_info.asset])

    return invoke('close_unit', {
      account1: getBatchAccount(account_1, getAccountProxy(account_1)),
      account2: getBatchAccount(account_2, getAccountProxy(account_2)),
      asset: unit.base_unit_info.asset,
    }).then(() => {
      setClosingUnits(prev =>
        prev.filter(asset => asset !== unit.base_unit_info.asset),
      )
      fetchUserStates()
    })
  }, [])

  return {
    account_1,
    account_2,
    units,
    balances,
    unitTimings,
    closingUnits,
    reCreatingUnits,
    initialLoading,
    createUnit,
    closeUnit,
  }
}
