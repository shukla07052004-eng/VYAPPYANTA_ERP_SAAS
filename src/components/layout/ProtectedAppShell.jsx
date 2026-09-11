        "use client"
        import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
        import { AppProvider } from '@/context/AppContext'
        import { ToastProvider } from '@/context/ToastContext'
        import { useToast } from '@/context/ToastContext'
        import { EscapeProvider, useEscapeAction } from '@/context/EscapeContext'
        import useKeyboard, { DEFAULT_SHORTCUTS, KEYBOARD_SETTINGS_STORAGE_KEY } from '@/hooks/useKeyboard'
        import useFocusManager from '@/hooks/useFocusManager'
        import Sidebar, { NAV_ITEMS } from '@/components/layout/Sidebar'
        import Topbar from '@/components/layout/Topbar'
        import { scrollElementIntoView } from '@/utils/focusScroll'

        // import Dashboard from '@/pages/Dashboard'
        // import SalesPage from './pages/Sales.jsx'
        // import PurchasePage from './pages/Purchase.jsx'
        // import PartiesPage from './pages/Parties.jsx'
        // import KeyboardSettingsPage from './pages/KeyboardSettings.jsx'
        // import NewInvoicePage from './pages/NewInvoicePage.jsx'
        // import NewPurchasePage from './pages/Newpuchasepage.jsx'
        // import PartyFormPage from './pages/PartyFormPage.jsx'
        // import ExpenseManagementPage from './pages/ExpenseManagementPage.jsx'
        // import { BankingDashboardPage, BankingModulePage, ItemsMasterPage, UtilitiesDashboardPage, UtilityModulePage } from './pages/WorkspaceModules.jsx'
        import { findSidebarSectionByPath, getVisibleSidebarItems } from '@/data/erpModules'
        import { usePathname, useRouter } from "next/navigation";

        // import {
        //   DuesPage,
        //   ReportsPage,
        //   WorkersPage,
        // } from './pages/OtherPages.jsx'

        // const AiIntelligencePage = React.lazy(() => import('./features/ai-intelligence/AiIntelligencePage.jsx'))

        const PAGE_FOCUS_TARGETS = {
            '/': '#dashboard-recent-invoices [data-focus-item="true"]',
            '/dashboard': '#dashboard-recent-invoices [data-focus-item="true"]',
            '/sales': '#sales-invoices [data-focus-item="true"]',
            '/sales/new': '[data-page-focus="invoice-party"]',
            '/purchase/new': '[data-page-focus="purchase-supplier"]',
            '/purchase': '#purchase-list [data-focus-item="true"]',
            '/parties': '#parties-list [data-focus-item="true"]',
            '/parties/new': '[data-page-focus="party-company"]',
            '/reports': '#reports-grid [data-focus-item="true"]',
            '/reports/profit-loss': '[data-focus-item="true"]',
            '/reports/cash-flow': '#report-cash-flow [data-focus-item="true"]',
            '/reports/party-ledger': '#report-party-ledger [data-focus-item="true"]',
            '/reports/expenses': '#report-expenses-analysis [data-focus-item="true"]',
            '/reports/stock': '#report-stock [data-focus-item="true"]',
            '/reports/gst': '[data-gst-sidebar-item="true"]',
            '/reports/billwise': '#report-billwise-profit [data-focus-item="true"]',
            '/items': '#items-master-table [data-focus-item="true"]',
            '/ai-intelligence': '#ai-intelligence-tree [data-focus-item="true"]',
            '/ai-reports': '#ai-reports-dashboard [data-focus-item="true"]',
            '/ai-reports/sales-prediction': '#sales-prediction-subnav',
            '/ai-reports/sales-prediction/forecast': '#sales-prediction-subnav',
            '/ai-reports/purchase-prediction': '#ai-purchase-prediction [data-focus-item="true"]',
            '/ai-reports/dead-stock-analysis': '#ai-dead-stock-analysis [data-focus-item="true"]',
            '/ai-reports/expense-analysis': '#ai-expense-analysis [data-focus-item="true"]',
            '/ai-reports/gst-analysis': '#ai-gst-analysis [data-focus-item="true"]',
            '/ai-reports/smart-reorder-suggestions': '#ai-smart-reorder-suggestions [data-focus-item="true"]',
            '/ai-reports/profit-analysis': '#ai-profit-analysis [data-focus-item="true"]',
            '/ai-reports/customer-behaviour': '#ai-customer-behaviour [data-focus-item="true"]',
            '/ai-reports/vendor-analysis': '#ai-vendor-analysis [data-focus-item="true"]',
            '/ai-reports/fast-moving-items': '#ai-fast-moving-items [data-focus-item="true"]',
            '/banking': '#banking-dashboard [data-focus-item="true"]',
            '/banking/loan-accounts': '#loan-accounts-table [data-focus-item="true"]',
            '/banking/checks': '#checks-table [data-focus-item="true"]',
            '/banking/bank-accounts': '#bank-accounts-table [data-focus-item="true"]',
            '/banking/cash-in-hand': '#cash-transactions-table [data-focus-item="true"]',
            '/utilities': '#utilities-dashboard [data-focus-item="true"]',
            '/utilities/manage-companies': '#company-list [data-focus-item="true"]',
            '/utilities/backup-restore': '[data-focus-item="true"]',
            '/utilities/data-verification': '#verification-matrix [data-focus-item="true"]',
            '/utilities/item-libraries': '#item-library-table [data-focus-item="true"]',
            '/utilities/bulk-update-tax-slab': '#bulk-tax-preview [data-focus-item="true"]',
            '/utilities/export-items': '#export-items-table [data-focus-item="true"]',
            '/utilities/import-items': '#import-items-table [data-focus-item="true"]',
            '/utilities/sync-share': '#sync-share-table [data-focus-item="true"]',
            '/workers': '#workers-grid [data-focus-item="true"]',
            '/expense': '#expense-statement [data-focus-item="true"]',
            '/dues': '#dues-list [data-focus-item="true"]',
            '/settings/keyboard': '#keyboard-settings-form input',
        }

        function isLockedWorkspacePath(pathname) {
            return pathname === '/newInvoice' || pathname === '/newPurchase' || pathname === '/newParty'
        }

        function parentIdForPath(pathname) {
            return findSidebarSectionByPath(pathname)
        }

        function getPageFocusTarget(pathname) {
            if (pathname === '/ai-intelligence' || pathname.startsWith('/ai-intelligence/')) {
                return '#ai-intelligence-tree [data-focus-item="true"]'
            }

            return PAGE_FOCUS_TARGETS[pathname] ?? PAGE_FOCUS_TARGETS['/dashboard']
        }

        function sidebarItemIdForPath(pathname) {
            const normalizedPath = pathname === '/' ? '/dashboard' : pathname
            const directMatch = NAV_ITEMS.find((item) => item.path === normalizedPath)
            if (directMatch) return directMatch.id

            for (const item of NAV_ITEMS) {
                const childMatch = item.children?.find((child) => normalizedPath === child.path || normalizedPath.startsWith(`${child.path}/`))
                if (childMatch) return childMatch.id
            }

            return parentIdForPath(normalizedPath)
        }

        function parentIdForSidebarItemId(itemId) {
            return NAV_ITEMS.find((item) => item.children?.some((child) => child.id === itemId))?.id ?? null
        }

        export default function App({ children }) {
            return (
                <ToastProvider>
                    <AppProvider>
                        <EscapeEnabledAppShell>
                            {children}
                        </EscapeEnabledAppShell>
                    </AppProvider>
                </ToastProvider>
            )
        }

        function LazyModule({ children }) {
            return (
                <React.Suspense fallback={<div style={{ padding: 18, color: 'var(--ink-40)', fontSize: 13 }}>Loading module...</div>}>
                    {children}
                </React.Suspense>
            )
        }


        function EscapeEnabledAppShell({ children }) {
            const pathname = usePathname();
            const router = useRouter()
            const focusManager = useFocusManager()
            const mainRef = useRef(null)
            const forceSidebarRestoreRef = useRef(false)

            const focusMainTarget = useCallback((path = pathname) => {
                const selector = getPageFocusTarget(path)

                if (!selector) return false

                requestAnimationFrame(() => {
                    const container = mainRef.current
                    if (!container) return
                    const target = document.querySelector(selector);
                    if (target instanceof HTMLElement && document.activeElement !== target) {
                        target.focus({ preventScroll: true })
                    }
                })

                return true
            }, [pathname])


            ///// sidebar conent start from hear-------------------------------------------------------------------------------------------

            const ensureSafeFocus = useCallback(() => {
                requestAnimationFrame(() => {
                    const activeElement = document.activeElement
                    const invalidFocus = !(activeElement instanceof HTMLElement)
                        || activeElement === document.body
                        || !activeElement.isConnected
                        || activeElement.closest('[aria-hidden="true"]')

                    if (!invalidFocus) return
                    if (focusManager.restoreFocus()) return
                    focusMainTarget(pathname)
                })
            }, [focusMainTarget, focusManager, pathname])



            const focusActiveSidebarItem = useCallback(() => {
                const activeElement = document.activeElement
                if (activeElement instanceof HTMLElement && activeElement !== document.body) {
                    activeElement.blur?.()
                }

                const activeKey = String(focusManager.activeFocusKey || '')
                if (activeKey.startsWith('sidebar-') && focusManager.focus(activeKey)) {
                    return true
                }
                const sidebarItemId = sidebarItemIdForPath(pathname)
                if (sidebarItemId && focusManager.focus(`sidebar-${sidebarItemId}`)) return true
                return focusManager.focus('sidebar-dashboard')
            }, [focusManager, pathname])

            const handleUnhandledEscape = useCallback(() => {
                const activeElement = document.activeElement
                const focusInsideSidebar = activeElement instanceof HTMLElement && Boolean(activeElement.closest('[data-sidebar-root="true"]'))

                if (focusInsideSidebar) {
                    const activeKey = String(focusManager.activeFocusKey || '')
                    const currentSidebarId = activeKey.startsWith('sidebar-') ? activeKey.replace('sidebar-', '') : sidebarItemIdForPath(pathname)
                    const parentId = currentSidebarId ? parentIdForSidebarItemId(currentSidebarId) : null
                    if (parentId) {
                        focusManager.focus(`sidebar-${parentId}`)
                        return true
                    }
                    return focusActiveSidebarItem()
                }

                if (!isLockedWorkspacePath(pathname) && !focusInsideSidebar) {
                    return focusActiveSidebarItem()
                }

                const canGoBack = typeof window !== 'undefined' && Number(window.history.state?.idx) > 0
                if (canGoBack) {
                    forceSidebarRestoreRef.current = true
                    router.back()
                    return true
                }
                if (pathname !== '/' && pathname !== '/dashboard') {
                    forceSidebarRestoreRef.current = true
                    router.push('/dashboard')
                    return true
                }
                focusMainTarget('/dashboard')
                return true
            }, [focusActiveSidebarItem, focusMainTarget, focusManager, pathname, router])

            return (
                <EscapeProvider onUnhandledEscape={handleUnhandledEscape} onAfterEscape={ensureSafeFocus}>
                    <AppShell
                        focusManager={focusManager}
                        mainRef={mainRef}
                        focusMainTarget={focusMainTarget}
                        forceSidebarRestoreRef={forceSidebarRestoreRef}
                    >
                        {children}
                    </AppShell>
                </EscapeProvider>
            )
        }
        function AppShell({ focusManager, mainRef, focusMainTarget, forceSidebarRestoreRef, children }) {
            const toast = useToast()
            const router = useRouter()
            const [sidebarVisible, setSidebarVisible] = useState(false)
            const [shortcutSettings, setShortcutSettings] = useState(() => {
                if (typeof window === 'undefined') return DEFAULT_SHORTCUTS
                const saved = window.localStorage.getItem(KEYBOARD_SETTINGS_STORAGE_KEY)
                return saved ? { ...DEFAULT_SHORTCUTS, ...JSON.parse(saved) } : DEFAULT_SHORTCUTS
            })
            const pathname = usePathname();
            const [openSidebarSectionId, setOpenSidebarSectionId] = useState(() => findSidebarSectionByPath(pathname))
            const visibleSidebarItems = useMemo(() => getVisibleSidebarItems(openSidebarSectionId), [openSidebarSectionId])
            const [sidebarIndex, setSidebarIndex] = useState(0)
            const [routeFocusMode, setRouteFocusMode] = useState('idle')
            const isLockedWorkspaceRoute = isLockedWorkspacePath(pathname)
            const searchRef = useRef(null)
            const initialContentFocusSkippedRef = useRef(false)

            const focusSidebarItemById = useCallback((itemId, { collapseParent = false } = {}) => {
                if (!itemId) return false

                const parentId = parentIdForSidebarItemId(itemId)
                const focusTargetId = collapseParent && parentId ? parentId : itemId
                const sectionToOpen = collapseParent ? null : (parentId ?? (NAV_ITEMS.find((item) => item.id === itemId && item.children?.length) ? itemId : null))

                if (sectionToOpen !== openSidebarSectionId) {
                    setOpenSidebarSectionId(sectionToOpen)
                }

                const activeElement = document.activeElement
                if (activeElement instanceof HTMLElement && activeElement !== document.body) {
                    activeElement.blur?.()
                }

                let attempts = 8
                const tryFocus = () => {
                    const focused = focusManager.focus(`sidebar-${focusTargetId}`)
                    if (focused) {
                        requestAnimationFrame(() => {
                            const node = focusManager.getNode(`sidebar-${focusTargetId}`)
                            scrollElementIntoView(node, { block: 'nearest' })
                        })
                        return
                    }
                    if (attempts <= 0) return
                    attempts -= 1
                    requestAnimationFrame(tryFocus)
                }

                requestAnimationFrame(tryFocus)
                return true
            }, [focusManager, openSidebarSectionId])

            useEffect(() => {
                const timer = setTimeout(() => setSidebarVisible(true), 200)
                return () => clearTimeout(timer)
            }, [])

            useEffect(() => {
                const parentSectionId = findSidebarSectionByPath(pathname)
                if (parentSectionId) setOpenSidebarSectionId(parentSectionId)
            }, [pathname])

            useEffect(() => {
                const activePath = pathname === '/' ? '/dashboard' : pathname
                const activeItemIndex = visibleSidebarItems.findIndex((item) => item.path === activePath || item.id === parentIdForPath(activePath))
                setSidebarIndex(activeItemIndex >= 0 ? activeItemIndex : 0)
            }, [pathname, visibleSidebarItems])

            useEffect(() => {
                if (routeFocusMode !== 'content') return
                focusMainTarget(pathname)
                setRouteFocusMode('idle')
            }, [focusMainTarget, pathname, routeFocusMode])

            useEffect(() => {
                if (isLockedWorkspaceRoute) return
                if (!initialContentFocusSkippedRef.current) {
                    initialContentFocusSkippedRef.current = true
                    return
                }

                const activeElement = document.activeElement
                const mainElement = mainRef.current
                const focusInsideMain = activeElement instanceof HTMLElement && mainElement?.contains(activeElement)
                if (focusInsideMain) return
                focusMainTarget(pathname)
            }, [focusMainTarget, isLockedWorkspaceRoute, pathname, mainRef])

            useEffect(() => {
                if (isLockedWorkspaceRoute) return
                if (!sidebarVisible) return

                if (forceSidebarRestoreRef?.current) {
                    forceSidebarRestoreRef.current = false
                    const targetId = sidebarItemIdForPath(pathname) ?? 'dashboard'
                    focusSidebarItemById(targetId)
                    return
                }
            }, [focusSidebarItemById, forceSidebarRestoreRef, isLockedWorkspaceRoute, pathname, sidebarVisible])

            const handleSidebarNavigate = useCallback((path) => {
                setRouteFocusMode('content')
                router.push(path)
            }, [router])

            const handleSidebarToggle = useCallback((sectionId) => {
                setOpenSidebarSectionId((current) => current === sectionId ? null : sectionId)
            }, [])

            useEscapeAction({
                active: !isLockedWorkspaceRoute,
                priority: 5,
                when: () => String(focusManager.activeFocusKey || '').startsWith('sidebar-'),
                handler: () => {
                    const activeKey = String(focusManager.activeFocusKey || '')
                    const currentSidebarId = activeKey.replace('sidebar-', '')
                    const parentId = parentIdForSidebarItemId(currentSidebarId)

                    if (parentId) {
                        const collapsedItems = getVisibleSidebarItems(null)
                        const nextIndex = collapsedItems.findIndex((item) => item.id === parentId)
                        setOpenSidebarSectionId(null)
                        setSidebarIndex(nextIndex >= 0 ? nextIndex : 0)
                        focusSidebarItemById(currentSidebarId, { collapseParent: true })
                        return true
                    }

                    if (openSidebarSectionId === currentSidebarId) {
                        const collapsedItems = getVisibleSidebarItems(null)
                        const nextIndex = collapsedItems.findIndex((item) => item.id === currentSidebarId)
                        setOpenSidebarSectionId(null)
                        setSidebarIndex(nextIndex >= 0 ? nextIndex : 0)
                        focusSidebarItemById(currentSidebarId, { collapseParent: true })
                        return true
                    }

                    return false
                },
            })

            const handleSaveShortcuts = (nextSettings) => {
                const merged = { ...DEFAULT_SHORTCUTS, ...nextSettings }
                window.localStorage.setItem(KEYBOARD_SETTINGS_STORAGE_KEY, JSON.stringify(merged))
                setShortcutSettings(merged)
                toast('Keyboard settings saved locally', 'success')
            }

            useKeyboard({
                shortcuts: shortcutSettings,
                bindings: [
                    { id: 'focusSearch', allowInEditable: true, handler: () => searchRef.current?.focus({ preventScroll: true }) },
                    { id: 'newInvoice', allowInEditable: true, handler: () => router.push('/sales/new') },
                    {
                        id: 'navSales',
                        allowInEditable: true,
                        handler: () => {
                            setRouteFocusMode('content')
                            router.push('/sales')
                        },
                    },
                    {
                        id: 'navPurchase',
                        allowInEditable: true,
                        handler: () => {
                            setRouteFocusMode('content')
                            router.push('/purchase')
                        },
                    },
                    {
                        id: 'navReports',
                        allowInEditable: true,
                        handler: () => {
                            setRouteFocusMode('content')
                            router.push('/reports')
                        },
                    },
                    {
                        id: 'moveSidebarUp',
                        when: () => String(focusManager.activeFocusKey || '').startsWith('sidebar-'),
                        handler: () => {
                            const next = Math.max(sidebarIndex - 1, 0)
                            setSidebarIndex(next)
                            focusSidebarItemById(visibleSidebarItems[next]?.id)
                        },
                    },
                    {
                        id: 'moveSidebarDown',
                        when: () => String(focusManager.activeFocusKey || '').startsWith('sidebar-'),
                        handler: () => {
                            const next = Math.min(sidebarIndex + 1, visibleSidebarItems.length - 1)
                            setSidebarIndex(next)
                            focusSidebarItemById(visibleSidebarItems[next]?.id)
                        },
                    },
                    {
                        id: 'moveSidebarLeft',
                        when: () => String(focusManager.activeFocusKey || '').startsWith('sidebar-'),
                        handler: () => {
                            const current = visibleSidebarItems[sidebarIndex]
                            if (!current) return
                            if (current.parentId) {
                                const parentIndex = getVisibleSidebarItems(null).findIndex((item) => item.id === current.parentId)
                                setSidebarIndex(parentIndex >= 0 ? parentIndex : 0)
                                focusSidebarItemById(current.id, { collapseParent: true })
                                return
                            }
                            if (current.type === 'section' && openSidebarSectionId === current.id) {
                                const collapsedItems = getVisibleSidebarItems(null)
                                const nextIndex = collapsedItems.findIndex((item) => item.id === current.id)
                                setSidebarIndex(nextIndex >= 0 ? nextIndex : 0)
                                focusSidebarItemById(current.id, { collapseParent: true })
                            }
                        },
                    },
                    {
                        id: 'moveSidebarRight',
                        when: () => String(focusManager.activeFocusKey || '').startsWith('sidebar-'),
                        handler: () => {
                            const current = visibleSidebarItems[sidebarIndex]
                            if (!current || current.type !== 'section') return
                            if (openSidebarSectionId !== current.id) {
                                setOpenSidebarSectionId(current.id)
                                requestAnimationFrame(() => {
                                    const expandedItems = getVisibleSidebarItems(current.id)
                                    const firstChild = expandedItems.find((item) => item.parentId === current.id)
                                    if (firstChild) {
                                        const nextIndex = expandedItems.findIndex((item) => item.id === firstChild.id)
                                        setSidebarIndex(nextIndex >= 0 ? nextIndex : sidebarIndex)
                                        focusSidebarItemById(firstChild.id)
                                    }
                                })
                                return
                            }
                            const firstChild = visibleSidebarItems.find((item) => item.parentId === current.id)
                            if (firstChild) {
                                const nextIndex = visibleSidebarItems.findIndex((item) => item.id === firstChild.id)
                                setSidebarIndex(nextIndex >= 0 ? nextIndex : sidebarIndex)
                                focusSidebarItemById(firstChild.id)
                            }
                        },
                    },
                    {
                        id: 'selectSidebarItem',
                        when: () => String(focusManager.activeFocusKey || '').startsWith('sidebar-'),
                        handler: () => {
                            const current = visibleSidebarItems[sidebarIndex]
                            if (!current) return
                            if (current.type === 'section') {
                                handleSidebarToggle(current.id)
                                if(current.path){
                                    handleSidebarNavigate(current.path)
                                }
                                focusSidebarItemById(current.id)
                                return
                            }
                            handleSidebarNavigate(current.path || '/dashboard')
                        },
                    },
                ],
            })

            return (
                <div style={{ minHeight: '100vh', height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
                    {!isLockedWorkspaceRoute && (
                        <Topbar
                            onNewInvoice={() => router.push('/newInvoice')}
                            onNewPurchase={() => router.push('/newPurchase')}
                            onNewParty={() => router.push('/newParty')}
                            searchRef={searchRef}
                        />
                    )}

                    <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
                        {!isLockedWorkspaceRoute && (
                            <div className={sidebarVisible ? 'sidebar-appear' : ''} style={{ flexShrink: 0, width: 'var(--sidebar-w)' }}>
                                <Sidebar
                                    onNavigate={handleSidebarNavigate}
                                    onToggleSection={handleSidebarToggle}
                                    focusManager={focusManager}
                                    activeIndex={sidebarIndex}
                                    visibleItems={visibleSidebarItems}
                                    openSectionId={openSidebarSectionId}
                                    onActiveIndexChange={setSidebarIndex}
                                />
                            </div>
                        )}


                        <main
                            id="main-content"
                            ref={mainRef}
                            style={{
                                flex: 1,
                                overflowY: isLockedWorkspaceRoute ? 'hidden' : 'auto',
                                overflowX: 'hidden',
                                padding: isLockedWorkspaceRoute ? 0 : '18px 20px',
                                maxHeight: isLockedWorkspaceRoute ? '100vh' : 'calc(100vh - var(--topbar-h))',
                                height: isLockedWorkspaceRoute ? '100vh' : 'calc(100vh - var(--topbar-h))',
                                minWidth: 0,
                                minHeight: 0,
                                position: 'relative',
                                background: isLockedWorkspaceRoute ? '#fff' : undefined,
                            }}
                        >
                            {children}
                        </main>
                    </div>
                </div>
            )
        }
