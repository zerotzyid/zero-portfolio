import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export function useResource<T>(path: string, fallback: T): { data: T; loading: boolean; reload: () => void } {
  const [data, setData] = useState<T>(fallback)
  const [loading, setLoading] = useState(true)
  const load = () => {
    setLoading(true)
    api.get(path).then(setData).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(load, [path])
  return { data, loading, reload: load }
}
