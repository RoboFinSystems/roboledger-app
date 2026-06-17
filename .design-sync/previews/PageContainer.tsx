import { PageContainer, StatCard } from '@robosystems/core'
import { HiChartBar, HiDatabase } from 'react-icons/hi'

/** Single-column container with normal spacing at the xl max-width. */
export const Normal = () => (
  <PageContainer spacing="normal" maxWidth="xl">
    <h2 className="font-heading text-xl font-semibold text-gray-900">
      Overview
    </h2>
    <StatCard label="Total Graphs" value="12" icon={HiChartBar} />
    <StatCard label="Storage Used" value="1.2 GB" icon={HiDatabase} />
  </PageContainer>
)

/** Tighter spacing, narrower medium max-width. */
export const TightMedium = () => (
  <PageContainer spacing="tight" maxWidth="md">
    <StatCard label="Active Connections" value="247" />
    <StatCard label="Pending Imports" value="3" />
  </PageContainer>
)
