import { useEffect, useState } from 'react'

/**
 * Hook to safely render context-dependent data after hydration
 * Prevents hydration mismatches by delaying render until client-side
 * 
 * Usage:
 *   const mounted = useHydration()
 *   return mounted && <ComponentWithContextData />
 */
export function useHydration() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return mounted
}

export default useHydration
