"use client"

import { useCallback, useEffect, useState } from 'react'

const DEFAULT_SELECTOR = '[data-focus-item="true"]'

export default function useKeyboardListNavigation({
  orientation = 'vertical',
  selector = DEFAULT_SELECTOR,
  onLeaveBackward,
  onLeaveForward,
  onEscape,
  onSelect,
} = {}) {
  const [root, setRoot] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const attach = useCallback((node) => {
    setRoot(node)
  }, [])

  const getItems = useCallback(() => (
    root ? Array.from(root.querySelectorAll(selector)) : []
  ), [root, selector])

  const refresh = useCallback((index) => {
    const items = getItems()
    if (!items.length) {
      setCurrentIndex(0)
      return false
    }

    const requestedIndex = Number.isInteger(index)
      ? index
      : currentIndex
    const safeIndex = Math.min(Math.max(requestedIndex, 0), items.length - 1)
    setCurrentIndex(safeIndex)

    items.forEach((item, itemIndex) => {
      item.tabIndex = itemIndex === safeIndex ? 0 : -1
    })

    if (Number.isInteger(index)) {
      items[safeIndex].focus({ preventScroll: true })
    }

    return true
  }, [currentIndex, getItems])

  const focusItem = useCallback((index) => refresh(index), [refresh])
  const focusFirst = useCallback(() => focusItem(0), [focusItem])

  useEffect(() => {
    if (!root) return undefined

    const getItemIndex = (target) => {
      if (!(target instanceof Element)) return -1
      const item = target.closest(selector)
      if (!item || !root.contains(item)) return -1
      return getItems().indexOf(item)
    }

    const handleFocus = (event) => {
      const index = getItemIndex(event.target)
      if (index >= 0) refresh(index)
    }

    const handleKeyDown = (event) => {
      const index = getItemIndex(event.target)
      if (index < 0) return

      if (event.key === 'Escape' && onEscape) {
        if (onEscape(event, index) !== false) event.preventDefault()
        return
      }

      if (event.key === 'Enter' && onSelect) {
        event.preventDefault()
        onSelect(event, index)
        return
      }

      let direction = 0
      if (orientation === 'vertical') {
        if (event.key === 'ArrowDown') direction = 1
        if (event.key === 'ArrowUp') direction = -1
      } else if (orientation === 'horizontal') {
        if (event.key === 'ArrowRight') direction = 1
        if (event.key === 'ArrowLeft') direction = -1
      } else if (orientation === 'both') {
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') direction = 1
        if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') direction = -1
      }

      if (!direction) return

      const items = getItems()
      const isAtBoundary = direction < 0 ? index === 0 : index === items.length - 1
      const onLeave = direction < 0 ? onLeaveBackward : onLeaveForward
      if (isAtBoundary && onLeave && onLeave(event, index) !== false) {
        event.preventDefault()
        return
      }

      event.preventDefault()
      focusItem(index + direction)
    }

    const observer = new MutationObserver(() => refresh())
    observer.observe(root, { childList: true, subtree: true })
    root.addEventListener('focusin', handleFocus)
    root.addEventListener('keydown', handleKeyDown)
    const items = getItems()
    const initialIndex = Math.min(currentIndex, Math.max(items.length - 1, 0))
    items.forEach((item, itemIndex) => {
      item.tabIndex = itemIndex === initialIndex ? 0 : -1
    })

    return () => {
      observer.disconnect()
      root.removeEventListener('focusin', handleFocus)
      root.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    focusItem,
    getItems,
    onEscape,
    onLeaveBackward,
    onLeaveForward,
    onSelect,
    orientation,
    refresh,
    root,
    selector,
    currentIndex,
  ])

  return { attach, refresh, focusItem, focusFirst }
}
