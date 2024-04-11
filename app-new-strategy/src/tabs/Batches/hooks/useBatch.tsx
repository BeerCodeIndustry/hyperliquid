import { invoke } from '@tauri-apps/api'
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { toast } from 'react-toastify'

import { GlobalContext } from '../../../context'
import { Account, AccountState, Unit } from '../../../types'
import { getBatchAccount, transformAccountStatesToUnits } from '../../../utils'

interface Props {
  accounts: string[]
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
  batchAccounts: Account[]
  units: Unit[]
  balances: Record<string, string>
  unitTimings: Record<string, { openedTiming: number; recreateTiming: number }>
  closingUnits: string[]
  recreatingUnits: string[]
  initialLoading: boolean
  setTimings: (
    asset: string,
    recreateTiming: number,
    openedTiming: number,
  ) => Promise<void>
  getUnitTimingOpened: (asset: string) => number
  getUnitTimingReacreate: (asset: string) => number
  createUnit: (payload: CreateUnitPayload) => Promise<unknown>
  closeUnit: (unit: Unit) => Promise<unknown>
}

const UPDATE_INTERVAL = 2500

export const useBatch = ({
  accounts: accountsProps,
  id,
  name,
}: Props): ReturnType => {
  const { accounts, getAccountProxy, getUnitTimings, setUnitInitTimings } =
    useContext(GlobalContext)

  const batchAccounts = useMemo(
    () =>
      accountsProps.map(a => {
        return accounts.find(b => b.id === a)!
      })!,
    [accountsProps],
  )

  const updatingRef = useRef(false)

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
      account1: getBatchAccount(
        //todo
        batchAccounts[0],
        getAccountProxy(batchAccounts[0]),
      ),
      account2: getBatchAccount(
        batchAccounts[1],
        getAccountProxy(batchAccounts[1]),
      ),
      account3: getBatchAccount(
        batchAccounts[2],
        getAccountProxy(batchAccounts[2]),
      ),
      account4: getBatchAccount(
        batchAccounts[3],
        getAccountProxy(batchAccounts[3]),
      ),
    }).then((res: AccountState[]) => {
      setAccountState(
        batchAccounts.reduce((acc, account, index) => {
          return { ...acc, [account.public_address]: res[index] }
        }, {}),
      )

      setBalances(
        batchAccounts.reduce((acc, account, index) => {
          return {
            ...acc,
            [account.public_address]: res[index].marginSummary.accountValue,
          }
        }, {}),
      )

      return res
    }) as Promise<[AccountState, AccountState]>
  }, [batchAccounts])

  const updateLoop = useCallback(() => {
    updatingRef.current = true
    const now = Date.now() - UPDATE_INTERVAL
    return fetchUserStates()
      .then((res: [AccountState, AccountState]) => {
        const units = transformAccountStatesToUnits(res)

        units.forEach((unit: Unit) => {
          const unitOpenedTiming = getUnitTimingOpened(
            unit.base_unit_info.asset,
          )
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
            now - unitOpenedTiming >= unitRecreateTiming ||
            unit.positions.length !== accounts.length
          ) {
            recreateUnit({
              asset: unit.base_unit_info.asset,
              sz: unit.base_unit_info.size,
              leverage: unit.base_unit_info.leverage,
            })
          }
        })
      })
      .finally(() => {
        updatingRef.current = false
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
    const interval = setInterval(() => {
      if (updatingRef.current === true) {
        return
      }
      updateLoop()
    }, UPDATE_INTERVAL)

    return () => {
      clearInterval(interval)
    }
  }, [updateLoop])

  const createUnit = useCallback(
    async ({ asset, sz, leverage, timing }: CreateUnitPayload) => {
      setCreatingUnits(prev => [...prev, asset])

      return invoke('create_unit', {
        account1: getBatchAccount(
          //todo
          batchAccounts[0],
          getAccountProxy(batchAccounts[0]),
        ),
        account2: getBatchAccount(
          batchAccounts[1],
          getAccountProxy(batchAccounts[1]),
        ),
        account3: getBatchAccount(
          batchAccounts[2],
          getAccountProxy(batchAccounts[2]),
        ),
        account4: getBatchAccount(
          batchAccounts[3],
          getAccountProxy(batchAccounts[3]),
        ),
        unit: {
          asset,
          sz,
          leverage,
        },
      }).finally(async () => {
        await setTimings(asset, timing, Date.now())
        await fetchUserStates()
        setCreatingUnits(prev => prev.filter(coin => coin !== asset))
      })
    },
    [batchAccounts, fetchUserStates, setTimings],
  )

  const closeUnit = useCallback(
    (unit: Unit) => {
      setClosingUnits(prev => [...prev, unit.base_unit_info.asset])

      return invoke('close_unit', {
        account1: getBatchAccount(
          //todo
          batchAccounts[0],
          getAccountProxy(batchAccounts[0]),
        ),
        account2: getBatchAccount(
          batchAccounts[1],
          getAccountProxy(batchAccounts[1]),
        ),
        account3: getBatchAccount(
          batchAccounts[2],
          getAccountProxy(batchAccounts[2]),
        ),
        account4: getBatchAccount(
          batchAccounts[3],
          getAccountProxy(batchAccounts[3]),
        ),
        asset: unit.base_unit_info.asset,
      }).finally(async () => {
        await fetchUserStates()
        setClosingUnits(prev =>
          prev.filter(asset => asset !== unit.base_unit_info.asset),
        )
      })
    },
    [batchAccounts, fetchUserStates],
  )

  const recreateUnit = useCallback(
    ({ asset, sz, leverage }: Omit<CreateUnitPayload, 'timing'>) => {
      setRecreatingUnits(prev => [...prev, asset])

      const promise = invoke('close_and_create_same_unit', {
        account1: getBatchAccount(
          //todo
          batchAccounts[0],
          getAccountProxy(batchAccounts[0]),
        ),
        account2: getBatchAccount(
          batchAccounts[1],
          getAccountProxy(batchAccounts[1]),
        ),
        account3: getBatchAccount(
          batchAccounts[2],
          getAccountProxy(batchAccounts[2]),
        ),
        account4: getBatchAccount(
          batchAccounts[3],
          getAccountProxy(batchAccounts[3]),
        ),
        unit: {
          asset,
          sz,
          leverage,
        },
      }).finally(async () => {
        const unitRecreateTiming = getUnitTimingReacreate(asset)
        await setTimings(asset, unitRecreateTiming, Date.now())
        await fetchUserStates()
        setRecreatingUnits(prev => prev.filter(unit => unit !== asset))
      })

      toast.promise(promise, {
        pending: `${name}: Re-creating unit with asset ${asset}`,
        success: `${name}: Unit with asset ${asset} re-created 👌`,
        error: `${name}: Error while re-creating unit with asset ${asset} error 🤯`,
      })
    },
    [batchAccounts, getUnitTimingReacreate, fetchUserStates, setTimings],
  )

  return {
    batchAccounts,
    units,
    balances,
    unitTimings,
    closingUnits,
    recreatingUnits,
    initialLoading,
    getUnitTimingOpened,
    getUnitTimingReacreate,
    setTimings,
    createUnit,
    closeUnit,
  }
}
