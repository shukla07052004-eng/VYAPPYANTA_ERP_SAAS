"use client"
import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext.jsx'
import { fmt, fmtShort } from '@/utils/helpers.js'
import useHydration from '@/hooks/useHydration.js'
import {
  Card,
  CardHead,
  FilterPills,
  KpiCard,
  PageHeader,
  SearchInput,
  Table,
} from '@/components/frontendUi/index.js'
import Button from '@/components/frontendUi/Button.jsx'
import ErpImportModal from '@/components/layout/ErpImportModel'

const PARTY_FILTERS = ['All', 'Customer', 'Supplier', 'Distributor', 'Carrier', 'Agent']

export default function PartiesPage() {
  const router = useRouter()
  const { parties, deleteParty } = useApp()
  const mounted = useHydration()
  const searchRef = useRef(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [importOpen, setImportOpen] = useState(false)

  useEffect(() => {
    const handler = (event) => {
      if (event.ctrlKey && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        searchRef.current?.focus({ preventScroll: true })
      }
      if (event.ctrlKey && event.key.toLowerCase() === 'n') {
        event.preventDefault()
        router.push('/newParty')
      }
    }

    document.addEventListener('keydown', handler, true)
    return () => document.removeEventListener('keydown', handler, true)
  }, [router])

  const filteredParties = parties.filter((party) => {
    const query = search.toLowerCase()

    const matchesQuery =
      String(party.companyName || '').toLowerCase().includes(query) ||
      String(party.address?.city || '').toLowerCase().includes(query)

    const matchesFilter =
      filter === 'All' || party.partyType === filter

    return matchesQuery && matchesFilter
  })

  const totalDR = parties
    .filter((party) => party.drCr === 'DR')
    .reduce(
      (sum, party) => sum + Number(party.remarks?.openingBalance || 0),
      0
    )

  const totalCR = parties
    .filter((party) => party.drCr === 'CR')
    .reduce(
      (sum, party) => sum + Number(party.remarks?.openingBalance || 0),
      0
    )

  const handleDeleteParty = async (partyId) => {
    console.log('ID from row:', partyId)

    const confirmed = window.confirm(
      'Are you sure you want to delete this party?'
    )

    if (!confirmed) return

    try {
      const response = await fetch(
        `/api/newParty?id=${encodeURIComponent(partyId)}`,
        {
          method: 'DELETE',
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Failed to delete party'
        )
      }

      deleteParty(partyId)

    } catch (error) {
      console.error('Delete party error:', error)

      window.alert(
        error.message || 'Failed to delete party'
      )
    }
  }

    return (
      <div className="animate-slide">
        <ErpImportModal open={importOpen} onClose={() => setImportOpen(false)} defaultKind="parties" />

        {mounted && (
          <>
            <PageHeader
              title="Parties"
              sub="Keyboard-first party directory with full enterprise onboarding."
              right={(
                <>
                  <Button variant="ghost" onClick={() => setImportOpen(true)}>Import</Button>
                  <Button variant="primary" onClick={() => router.push('/newParty')}>+ Add Party</Button>
                </>
              )}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 22 }}>
              <KpiCard label="Total Parties" value={parties.length} sub="Active accounts" />
              <KpiCard label="Total Receivable" value={fmtShort(totalDR)} />
              <KpiCard label="Total Payable" value={fmtShort(totalCR)} />
            </div>

            <Card>
              <CardHead
                title="All Parties"
                right={(
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <SearchInput inputRef={searchRef} value={search} onChange={setSearch} placeholder="Search parties..." />
                    <FilterPills options={PARTY_FILTERS} value={filter} onChange={setFilter} />
                  </div>
                )}
              />
              <Table
                focusId="parties-list"
                cols={[
                  {
                    key: 'companyName',
                    label: 'Party Name',
                  },

                  {
                    key: 'partyType',
                    label: 'Type',
                  },

                  {
                    key: 'phone',
                    label: 'Phone',
                    mono: true,
                    dim: true,
                  },

                  {
                    key: 'address',
                    label: 'City',
                    dim: true,
                    render: (_, row) => row.address?.city || '-',
                  },

                  {
                    key: 'remarks',
                    label: 'Balance',
                    right: true,
                    render: (_, row) => {
                      const balance = Number(
                        row.remarks?.openingBalance || 0
                      )

                      return balance
                        ? fmt(Math.abs(balance))
                        : '-'
                    },
                  },

                  {
                    key: '_edit',
                    label: '',
                    sortable: false,

                    render: (_, row) => (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button
                          size="sm"
                          variant="ghost"
                          tabIndex={-1}
                          onClick={(event) => {
                            event.stopPropagation()

                            router.push(
                              `/newParty?partyId=${encodeURIComponent(row._id)}`
                            )
                          }}
                        >
                          Edit
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          tabIndex={-1}
                          onClick={(event) => {
                            event.stopPropagation()

                            handleDeleteParty(row._id)
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    )

                  },
                ]}
                rows={filteredParties}
              />

            </Card>
          </>
        )}
      </div>
    )
  }

