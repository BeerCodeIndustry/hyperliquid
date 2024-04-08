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
  name: string
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
  recreatingUnits: string[]
  initialLoading: boolean
  getUnitTimingOpened: (asset: string) => number
  getUnitTimingReacreate: (asset: string) => number
  createUnit: (payload: CreateUnitPayload) => Promise<unknown>
  closeUnit: (unit: Unit) => Promise<unknown>
}

const UPDATE_INTERVAL = 2500

export const useBatch = ({
  account_id_1,
  account_id_2,
  id,
  name,
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
  const [recreatingUnits, setRecreatingUnits] = useState<string[]>([])

  const [balances, setBalances] = useState<Record<string, string>>({})

  const [accountStates, setAccountState] = useState<
    Record<string, AccountState>
  >({})

  const [unitTimings, setUnitTimings] = useState<
    Record<string, { openedTiming: number; recreateTiming: number }>
  >({})

  console.log(unitTimings)

  const units = useMemo(() => {
    return transformAccountStatesToUnits(Object.values(accountStates))
  }, [accountStates])

  const getUnitTimingOpened = useCallback(
    (asset: string): number => {
      return unitTimings[asset as keyof typeof unitTimings]?.openedTiming
    },
    [unitTimings],
  )

  const getUnitTimingReacreate = useCallback(
    (asset: string): number => {
      return unitTimings[asset as keyof typeof unitTimings]?.recreateTiming
    },
    [unitTimings],
  )

  const fetchUserStates = useCallback((): Promise<
    [AccountState, AccountState]
  > => {
    return invoke<[AccountState, AccountState]>('get_unit_user_states', {
      account1: getBatchAccount(account_1, getAccountProxy(account_1)),
      account2: getBatchAccount(account_2, getAccountProxy(account_2)),
    }).then((res: [AccountState, AccountState]) => {
      setAccountState({
        [account_1.public_address]: res[0],
        [account_2.public_address]: res[1],
      })
      setBalances({
        [account_1.public_address]: res[0].marginSummary.accountValue,
        [account_2.public_address]: res[1].marginSummary.accountValue,
      })

      return res
    }) as Promise<[AccountState, AccountState]>
  }, [account_1, account_2])

  const updateLoop = useCallback(() => {
    fetchUserStates().then((res: [AccountState, AccountState]) => {
      const units = transformAccountStatesToUnits(res)

      units.forEach((unit: Unit) => {
        const unitOpenedTiming = getUnitTimingOpened(unit.base_unit_info.asset)
        const unitRecreateTiming = getUnitTimingReacreate(
          unit.base_unit_info.asset,
        )

        if (
          closingUnits.includes(unit.base_unit_info.asset) ||
          recreatingUnits.includes(unit.base_unit_info.asset) ||
          creatingUnits.includes(unit.base_unit_info.asset)
        ) {
          return
        }

        if (
          Date.now() - unitOpenedTiming >= unitRecreateTiming ||
          unit.positions.length === 1
        ) {
          recreateUnit({
            asset: unit.base_unit_info.asset,
            sz: unit.base_unit_info.size,
            leverage: unit.base_unit_info.leverage,
          })
        }
      })
    })
  }, [
    fetchUserStates,
    closingUnits,
    recreatingUnits,
    creatingUnits,
    getUnitTimingOpened,
    getUnitTimingReacreate,
  ])

  useEffect(() => {
    Promise.all([getUnitTimings(id), fetchUserStates()]).then(
      ([unitTimings]) => {
        setUnitTimings(unitTimings)
        setInitialLoading(false)
      },
    )
  }, [])

  const setTimings = useCallback(
    async (asset: string, recreateTiming: number, openedTiming: number) => {
      await setUnitInitTimings(id, asset, recreateTiming, openedTiming)
      setUnitTimings(prev => ({
        ...prev,
        [asset]: {
          openedTiming,
          recreateTiming,
        },
      }))
    },
    [setUnitInitTimings, setUnitTimings],
  )

  useEffect(() => {
    const interval = setInterval(updateLoop, UPDATE_INTERVAL)

    return () => {
      clearInterval(interval)
    }
  }, [updateLoop])

  const createUnit = useCallback(
    async ({ asset, sz, leverage, timing }: CreateUnitPayload) => {
      setCreatingUnits(prev => [...prev, asset])

      return invoke('create_unit', {
        account1: getBatchAccount(account_1, getAccountProxy(account_1)),
        account2: getBatchAccount(account_2, getAccountProxy(account_2)),
        unit: {
          asset,
          sz,
          leverage,
        },
      }).finally(async () => {
        await setTimings(asset, timing, Date.now())
        fetchUserStates()
        setCreatingUnits(prev => prev.filter(coin => coin !== asset))
      })
    },
    [account_1, account_2, fetchUserStates, setTimings],
  )

  const closeUnit = useCallback(
    (unit: Unit) => {
      setClosingUnits(prev => [...prev, unit.base_unit_info.asset])

      return invoke('close_unit', {
        account1: getBatchAccount(account_1, getAccountProxy(account_1)),
        account2: getBatchAccount(account_2, getAccountProxy(account_2)),
        asset: unit.base_unit_info.asset,
      }).finally(() => {
        setClosingUnits(prev =>
          prev.filter(asset => asset !== unit.base_unit_info.asset),
        )
        fetchUserStates()
      })
    },
    [account_1, account_2, fetchUserStates],
  )

  const recreateUnit = useCallback(
    ({ asset, sz, leverage }: Omit<CreateUnitPayload, 'timing'>) => {
      setRecreatingUnits(prev => [...prev, asset])

      const promise = invoke('close_and_create_same_unit', {
        account1: getBatchAccount(account_1, getAccountProxy(account_1)),
        account2: getBatchAccount(account_2, getAccountProxy(account_2)),
        unit: {
          asset,
          sz,
          leverage,
        },
      }).finally(async () => {
        const unitRecreateTiming = getUnitTimingReacreate(asset)
        await setTimings(asset, unitRecreateTiming, Date.now())
        fetchUserStates()
        setRecreatingUnits(prev => prev.filter(asset => asset !== asset))
      })

      toast.promise(promise, {
        pending: `${name}: Re-creating unit with asset ${asset}`,
        success: `${name}: Unit with asset ${asset} re-created 👌`,
        error: `${name}: Error while re-creating unit with asset ${asset} error 🤯`,
      })
    },
    [account_1, account_2, getUnitTimingReacreate, fetchUserStates, setTimings],
  )

  return {
    account_1,
    account_2,
    units,
    balances,
    unitTimings,
    closingUnits,
    recreatingUnits,
    initialLoading,
    getUnitTimingOpened,
    getUnitTimingReacreate,
    createUnit,
    closeUnit,
  }
}
