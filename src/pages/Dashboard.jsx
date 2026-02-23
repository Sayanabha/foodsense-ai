import KPICards from '../components/dashboard/KPICards'
import DemandChart from '../components/dashboard/DemandChart'
import WasteChart from '../components/dashboard/WasteChart'
import InventoryTable from '../components/dashboard/InventoryTable'
import { useInventory } from '../hooks/useInventory'
import { useWasteLog } from '../hooks/useWasteLog'
import { usePredictions } from '../hooks/usePredictions'

export default function Dashboard() {
  const { inventory, atRisk, loading: il, getStatus } = useInventory()
  const { chartData, thisWeekWaste, thisWeekCostLost, loading: wl } = useWasteLog()
  const { demandChartData, accuracy, loading: pl } = usePredictions()
  const loading = il || wl || pl

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 1200 }} className="fade-in">
      <KPICards
        wasteToday={thisWeekWaste.toFixed(1)}
        accuracy={accuracy}
        costSaved={thisWeekCostLost}
        atRiskCount={atRisk.length}
        loading={loading}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <DemandChart data={demandChartData} loading={loading} />
        <InventoryTable inventory={inventory} getStatus={getStatus} loading={loading} />
      </div>
      <WasteChart data={chartData} loading={loading} />
    </div>
  )
}