"use client"
import { useCallback, useEffect, useRef, useState } from "react";

const clamp = (value, min, max) =>
  Math.min(Math.max(value, min), max);

export default function useFocusList({
  count = 0,
  initialIndex = 0,
  orientation = "vertical",
  columns = 1,
  loop = false,
  enabled = true,
  onEnter,
  onEscape,
  onActiveIndexChange,
} = {}) {
  const itemRefs = useRef([]);
  const [currentIndex, setCurrentIndexState] = useState(
    clamp(initialIndex, 0, Math.max(count - 1, 0))
  );

  /*
   * Keep index valid when number of items changes
   */
  useEffect(() => {
    setCurrentIndexState((current) =>
      clamp(current, 0, Math.max(count - 1, 0))
    );
  }, [count]);

  /*
   * Register DOM element
   */
  const register = useCallback(
    (index) => (node) => {
      itemRefs.current[index] = node;
    },
    []
  );

  /*
   * Focus a particular item
   */
  const focusItem = useCallback(
    (index) => {
      if (!count) return false;

      const safeIndex = clamp(
        index,
        0,
        Math.max(count - 1, 0)
      );

      setCurrentIndexState(safeIndex);

      requestAnimationFrame(() => {
        const node = itemRefs.current[safeIndex];

        if (node instanceof HTMLElement) {
          node.focus({
            preventScroll: true,
          });
        }
      });

      return true;
    },
    [count]
  );

  /*
   * Set index.
   *
   * This is intentionally exposed as a function because
   * your old ReportsWorkspace uses:
   *
   * focusList.setCurrentIndex(...)
   */
  const setCurrentIndex = useCallback(
    (index, shouldFocus = true) => {
      const safeIndex = clamp(
        index,
        0,
        Math.max(count - 1, 0)
      );

      setCurrentIndexState(safeIndex);

      if (shouldFocus) {
        requestAnimationFrame(() => {
          const node = itemRefs.current[safeIndex];

          if (node instanceof HTMLElement) {
            node.focus({
              preventScroll: true,
            });
          }
        });
      }
    },
    [count]
  );

  /*
   * Move to next / previous item
   */
  const move = useCallback(
    (step) => {
      if (!count) return;

      setCurrentIndexState((current) => {
        let next = current + step;

        if (loop) {
          next = (next + count) % count;
        } else {
          next = clamp(next, 0, count - 1);
        }

        requestAnimationFrame(() => {
          const node = itemRefs.current[next];

          if (node instanceof HTMLElement) {
            node.focus({
              preventScroll: true,
            });
          }
        });

        return next;
      });
    },
    [count, loop]
  );

  /*
   * Grid navigation
   *
   * Example with columns = 3:
   *
   *   0  1  2
   *   3  4  5
   *   6  7  8
   */
  const moveGrid = useCallback(
    (key) => {
      if (!count) return;

      setCurrentIndexState((current) => {
        const row = Math.floor(current / columns);
        const col = current % columns;

        let next = current;

        if (key === "ArrowRight") {
          if (col < columns - 1) {
            next = current + 1;
          }
        }

        if (key === "ArrowLeft") {
          if (col > 0) {
            next = current - 1;
          }
        }

        if (key === "ArrowDown") {
          const candidate = current + columns;

          if (candidate < count) {
            next = candidate;
          }
        }

        if (key === "ArrowUp") {
          const candidate = current - columns;

          if (candidate >= 0) {
            next = candidate;
          }
        }

        if (next !== current) {
          requestAnimationFrame(() => {
            const node = itemRefs.current[next];

            if (node instanceof HTMLElement) {
              node.focus({
                preventScroll: true,
              });
            }
          });
        }

        return next;
      });
    },
    [columns, count]
  );

  /*
   * Generate props for each item
   */
  const getItemProps = useCallback(
    (index, options = {}) => {
      return {
        ref: register(index),

        /*
         * IMPORTANT:
         *
         * Only one element is reachable by TAB.
         */
        tabIndex: currentIndex === index ? 0 : -1,

        "data-focus-item": "true",

        onFocus: (event) => {
          setCurrentIndexState(index);

          onActiveIndexChange?.(
            index,
            event.currentTarget
          );

          options.onFocus?.(event);
        },

        onClick: (event) => {
          setCurrentIndexState(index);

          options.onClick?.(event);
        },

        onKeyDown: (event) => {
          /*
           * Don't interfere with Ctrl/Alt/Cmd shortcuts
           */
          if (
            event.altKey ||
            event.ctrlKey ||
            event.metaKey
          ) {
            options.onKeyDown?.(event);
            return;
          }

          /*
           * Escape
           */
          if (event.key === "Escape") {
            if (onEscape) {
              const handled = onEscape(
                event,
                index
              );

              if (handled !== false) {
                event.preventDefault();
              }

              return;
            }
          }

          /*
           * Arrow navigation
           */

          if (orientation === "vertical") {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              move(1);
              return;
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              move(-1);
              return;
            }
          }

          if (orientation === "horizontal") {
            if (event.key === "ArrowRight") {
              event.preventDefault();
              move(1);
              return;
            }

            if (event.key === "ArrowLeft") {
              event.preventDefault();
              move(-1);
              return;
            }
          }

          /*
           * Both directions
           *
           * This is LINEAR navigation.
           *
           * ↓ = next
           * ↑ = previous
           * → = next
           * ← = previous
           */
          if (orientation === "both") {
            if (
              event.key === "ArrowDown" ||
              event.key === "ArrowRight"
            ) {
              event.preventDefault();
              move(1);
              return;
            }

            if (
              event.key === "ArrowUp" ||
              event.key === "ArrowLeft"
            ) {
              event.preventDefault();
              move(-1);
              return;
            }
          }

          /*
           * Grid navigation
           */
          if (orientation === "grid") {
            if (
              event.key === "ArrowDown" ||
              event.key === "ArrowUp" ||
              event.key === "ArrowLeft" ||
              event.key === "ArrowRight"
            ) {
              event.preventDefault();
              moveGrid(event.key);
              return;
            }
          }

          /*
           * Enter
           */
          if (event.key === "Enter") {
            event.preventDefault();

            onEnter?.(index, event);

            options.onEnter?.(
              index,
              event
            );

            return;
          }

          /*
           * Space
           */
          if (event.key === " ") {
            options.onSpace?.(
              index,
              event
            );

            return;
          }

          /*
           * Allow component-specific keyboard logic
           */
          options.onKeyDown?.(event);
        },

        /*
         * Prevent callers from accidentally overriding
         * our focus management.
         */
        ...options,

        ref: register(index),

        tabIndex:
          currentIndex === index ? 0 : -1,

        "data-focus-item": "true",
      };
    },
    [
      currentIndex,
      move,
      moveGrid,
      onActiveIndexChange,
      onEnter,
      onEscape,
      orientation,
      register,
    ]
  );

  /*
   * Keep the DOM tab indexes synchronized.
   */
  useEffect(() => {
    if (!enabled) return;

    itemRefs.current.forEach((node, index) => {
      if (node instanceof HTMLElement) {
        node.tabIndex =
          index === currentIndex ? 0 : -1;
      }
    });
  }, [currentIndex, enabled, count]);

  /*
   * First item
   */
  const focusFirst = useCallback(() => {
    focusItem(0);
  }, [focusItem]);

  /*
   * Current item
   */
  const focusCurrent = useCallback(() => {
    focusItem(currentIndex);
  }, [currentIndex, focusItem]);

  return {
    currentIndex,

    setCurrentIndex,

    focusItem,
    focusFirst,
    focusCurrent,

    move,

    getItemProps,

    itemRefs,
  };
}