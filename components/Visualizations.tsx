import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { AgentType, SalesOrder, InventoryItem, CostData, OverheadItem, Supplier, PurchaseOrder } from '../types';

// Hardcoded Chart Helpers (unchanged for logic simplicity in charts)
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const ChartContainer = ({ children, height = 300 }: { children?: React.ReactNode, height?: number }) => (
  <div style={{ width: '100%', height: height, minHeight: height }}>
    {children}
  </div>
);

// --- Static Dummy Data for Read-Only parts ---
const salesData = [
  { name: 'Jan', revenue: 4000, orders: 240 },
  { name: 'Feb', revenue: 3000, orders: 139 },
  { name: 'Mar', revenue: 2000, orders: 980 },
  { name: 'Apr', revenue: 2780, orders: 390 },
  { name: 'May', revenue: 1890, orders: 480 },
  { name: 'Jun', revenue: 2390, orders: 380 },
];
const cashFlowData = [
  { name: 'W1', inflow: 5000, outflow: 3000 },
  { name: 'W2', inflow: 7000, outflow: 4500 },
  { name: 'W3', inflow: 4000, outflow: 4200 },
  { name: 'W4', inflow: 8000, outflow: 3000 },
];
const balanceSheet = {
  assets: [
    { name: 'Kas & Setara Kas', value: 150000000 },
    { name: 'Piutang Usaha', value: 45000000 },
    { name: 'Persediaan', value: 85000000 },
    { name: 'Aset Tetap (Mesin)', value: 400000000 },
  ],
  liabilities: [
    { name: 'Utang Usaha', value: 35000000 },
    { name: 'Utang Gaji', value: 15000000 },
    { name: 'Pinjaman Bank', value: 200000000 },
  ],
  equity: [
    { name: 'Modal Disetor', value: 300000000 },
    { name: 'Laba Ditahan', value: 130000000 },
  ]
};
const incomeStatement = [
  { item: 'Pendapatan Penjualan', value: 500000000, type: 'credit' },
  { item: 'HPP', value: -250000000, type: 'debit' },
  { item: 'Laba Kotor', value: 250000000, type: 'total' },
  { item: 'Beban Ops', value: -80000000, type: 'debit' },
  { item: 'Laba Bersih', value: 170000000, type: 'grand_total' },
];
const wipData = [
  { name: 'Cutting', value: 12000000 },
  { name: 'Sewing', value: 28000000 },
  { name: 'Finishing', value: 8500000 },
  { name: 'QC', value: 4500000 },
];
const auditTrailLogs = [
    { id: 1, time: '2023-10-27 14:30', user: 'Admin Gudang', action: 'Input Penerimaan Barang', ref: 'PO-5003', details: 'Diterima parsial' },
    { id: 2, time: '2023-10-27 13:15', user: 'Finance Staff', action: 'Approve Invoice', ref: 'INV-2023-099', details: 'Pembayaran diterima' },
];

interface Props {
  activeAgent: AgentType | null;
  activeCapability?: string | null;
  // Data passed from App
  salesOrders: SalesOrder[];
  inventory: InventoryItem[];
  costs: CostData[];
  overhead: OverheadItem[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  // Handlers
  onAddSalesOrder: (order: SalesOrder) => void;
  onUpdateSalesStatus?: (id: string, newStatus: SalesOrder['status']) => void;
  onUpdateStock: (name: string, newStock: number) => void;
  onAddInventoryItem: (item: InventoryItem) => void;
  onUpdateCost: (name: string, newValue: number) => void;
  onAddCostComponent: (cost: CostData) => void;
  onAddOverhead: (item: OverheadItem) => void;
  onAddSupplier: (supplier: Supplier) => void;
  onAddPurchaseOrder: (po: PurchaseOrder) => void;
  onUpdatePurchaseStatus?: (id: string, newStatus: PurchaseOrder['status']) => void;
}

const Visualizations: React.FC<Props> = ({ 
  activeAgent, 
  activeCapability,
  salesOrders,
  inventory,
  costs,
  overhead,
  suppliers,
  purchaseOrders,
  onAddSalesOrder,
  onUpdateSalesStatus,
  onUpdateStock,
  onAddInventoryItem,
  onUpdateCost,
  onAddCostComponent,
  onAddOverhead,
  onAddSupplier,
  onAddPurchaseOrder,
  onUpdatePurchaseStatus
}) => {
  // Local state for forms
  const [newOrder, setNewOrder] = useState<Partial<SalesOrder>>({ client: '', amount: 0, status: 'Baru' });
  const [newOverhead, setNewOverhead] = useState<Partial<OverheadItem>>({ category: '', amount: 0, basis: '' });
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({ id: '', name: '', stock: 0, reorder: 0 });
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({ name: '', material: '', contact: '', rating: 5 });
  const [newPO, setNewPO] = useState<Partial<PurchaseOrder>>({ supplier: '', date: '', items: '', status: 'Baru' });
  const [newCost, setNewCost] = useState<Partial<CostData>>({ name: '', value: 0 });

  if (!activeAgent || activeAgent === AgentType.ROUTER) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <p>Pilih agen atau ajukan pertanyaan untuk melihat data visual.</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    let color = 'bg-slate-100 text-slate-600';
    if (status === 'Selesai' || status === 'Diterima') color = 'bg-green-100 text-green-700';
    if (status === 'Proses' || status === 'Dikirim') color = 'bg-blue-100 text-blue-700';
    if (status === 'Menunggu' || status === 'Baru') color = 'bg-amber-100 text-amber-700';
    return color;
  };

  const renderStatus = (status: string) => {
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>{status}</span>;
  };

  const fmt = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;

  // Form Handlers
  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newOrder.client && newOrder.amount) {
      onAddSalesOrder({
        id: `SO-${Math.floor(Math.random() * 10000)}`,
        date: new Date().toISOString().split('T')[0],
        client: newOrder.client,
        amount: Number(newOrder.amount),
        status: newOrder.status as any || 'Baru'
      });
      setNewOrder({ client: '', amount: 0, status: 'Baru' });
    }
  };

  const handleSubmitOverhead = (e: React.FormEvent) => {
    e.preventDefault();
    if (newOverhead.category && newOverhead.amount && newOverhead.basis) {
      onAddOverhead({
        category: newOverhead.category,
        amount: Number(newOverhead.amount),
        basis: newOverhead.basis
      });
      setNewOverhead({ category: '', amount: 0, basis: '' });
    }
  };

  const handleSubmitItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.name && newItem.stock) {
      onAddInventoryItem({
        id: newItem.id || `RM-${Math.floor(Math.random() * 1000)}`,
        name: newItem.name,
        stock: Number(newItem.stock),
        reorder: Number(newItem.reorder) || 100
      });
      setNewItem({ id: '', name: '', stock: 0, reorder: 0 });
    }
  };

  const handleSubmitSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSupplier.name && newSupplier.material) {
      onAddSupplier({
        id: `SUP-${Math.floor(Math.random() * 1000)}`,
        name: newSupplier.name,
        material: newSupplier.material,
        rating: Number(newSupplier.rating) || 5,
        contact: newSupplier.contact || '-'
      });
      setNewSupplier({ name: '', material: '', contact: '', rating: 5 });
    }
  };

  const handleSubmitPO = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPO.supplier && newPO.items) {
      onAddPurchaseOrder({
        id: `PO-${Math.floor(Math.random() * 10000)}`,
        supplier: newPO.supplier,
        date: newPO.date || new Date().toISOString().split('T')[0],
        items: newPO.items,
        status: newPO.status as any || 'Baru'
      });
      setNewPO({ supplier: '', date: '', items: '', status: 'Baru' });
    }
  };

  const handleSubmitCost = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCost.name && newCost.value) {
      onAddCostComponent({
        name: newCost.name,
        value: Number(newCost.value)
      });
      setNewCost({ name: '', value: 0 });
    }
  };

  return (
    <div className="h-full w-full p-4 flex flex-col gap-4 overflow-hidden">
      
      {/* --- SALES AND REVENUE --- */}
      {activeAgent === AgentType.SALES_AND_REVENUE && (
        <>
          {/* Default View or STATUS_PESANAN: Show Table & Input */}
          {(!activeCapability || activeCapability === 'STATUS_PESANAN') && (
            <div className="flex-1 min-h-0 flex flex-col">
               <h3 className="text-sm font-semibold mb-3 text-slate-700">Data Penjualan & Input Pesanan</h3>
               
               {/* Add Order Form - Moved to top of table section */}
               <form onSubmit={handleSubmitOrder} className="bg-slate-50 p-3 rounded mb-4 grid grid-cols-4 gap-2 items-end border border-slate-200">
                 <div>
                   <label className="text-xs text-slate-500 block mb-1">Klien</label>
                   <input type="text" className="w-full text-sm border p-1 rounded" placeholder="Nama Klien" value={newOrder.client} onChange={e=>setNewOrder({...newOrder, client: e.target.value})} required />
                 </div>
                 <div>
                   <label className="text-xs text-slate-500 block mb-1">Nilai (Rp)</label>
                   <input type="number" className="w-full text-sm border p-1 rounded" placeholder="0" value={newOrder.amount || ''} onChange={e=>setNewOrder({...newOrder, amount: parseInt(e.target.value)})} required />
                 </div>
                 <div>
                   <label className="text-xs text-slate-500 block mb-1">Status</label>
                   <select className="w-full text-sm border p-1 rounded" value={newOrder.status} onChange={e=>setNewOrder({...newOrder, status: e.target.value as any})}>
                     <option value="Baru">Baru</option>
                     <option value="Proses">Proses</option>
                     <option value="Menunggu">Menunggu</option>
                   </select>
                 </div>
                 <button type="submit" className="bg-indigo-600 text-white text-sm py-1.5 rounded hover:bg-indigo-700">Tambah Pesanan</button>
               </form>

               <div className="overflow-auto flex-1 border border-slate-200 rounded-lg">
                 <table className="w-full text-sm text-left text-slate-600">
                   <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-10">
                     <tr>
                       <th className="px-3 py-2 border-b">ID</th>
                       <th className="px-3 py-2 border-b">Klien</th>
                       <th className="px-3 py-2 border-b">Tanggal</th>
                       <th className="px-3 py-2 text-right border-b">Nilai</th>
                       <th className="px-3 py-2 border-b">Status</th>
                     </tr>
                   </thead>
                   <tbody>
                     {salesOrders.map((order) => (
                       <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                         <td className="px-3 py-2 font-medium text-slate-900">{order.id}</td>
                         <td className="px-3 py-2">{order.client}</td>
                         <td className="px-3 py-2">{order.date}</td>
                         <td className="px-3 py-2 text-right">{fmt(order.amount)}</td>
                         <td className="px-3 py-2">
                           {onUpdateSalesStatus ? (
                             <select
                               value={order.status}
                               onChange={(e) => onUpdateSalesStatus(order.id, e.target.value as any)}
                               className={`text-xs font-medium rounded-full px-2 py-1 border-0 cursor-pointer focus:ring-2 focus:ring-indigo-500 ${getStatusColor(order.status)}`}
                             >
                               <option value="Baru">Baru</option>
                               <option value="Proses">Proses</option>
                               <option value="Menunggu">Menunggu</option>
                               <option value="Dikirim">Dikirim</option>
                               <option value="Selesai">Selesai</option>
                             </select>
                           ) : (
                             renderStatus(order.status)
                           )}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {/* Analysis View: Only shown when explicitly selected */}
          {activeCapability === 'ANALISIS_PENDAPATAN' && (
            <div className="flex-1 min-h-0 flex flex-col">
              <h3 className="text-sm font-semibold mb-2 text-slate-700">Analisis Pendapatan Mingguan</h3>
              <div className="flex-1 w-full min-h-[300px]">
                <ChartContainer>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip formatter={(value: number) => fmt(value)} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Area type="monotone" dataKey="revenue" stackId="1" stroke="#4F46E5" fill="#4F46E5" name="Pendapatan" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </div>
          )}

          {activeCapability === 'FAKTUR_OTOMATIS' && (
             <div className="flex flex-col h-full overflow-y-auto bg-white border border-slate-200 shadow-sm p-6 rounded-lg">
                <div className="text-center py-10 text-slate-400">
                  <p>Fitur generator PDF belum tersedia di versi demo.</p>
                  <p>Gunakan chat untuk meminta draf teks faktur.</p>
                </div>
             </div>
          )}
        </>
      )}

      {/* --- PURCHASING AND INVENTORY --- */}
      {activeAgent === AgentType.PURCHASING_AND_INVENTORY && (
        <>
          {(!activeCapability || activeCapability === 'STOK_RENDAH') && (
            <div className="flex-1 min-h-0 flex flex-col">
              <h3 className="text-sm font-semibold mb-2 text-slate-700">
                {activeCapability === 'STOK_RENDAH' ? 'Edit & Monitor Stok' : 'Level Stok Bahan Baku'}
              </h3>
              
              {activeCapability === 'STOK_RENDAH' ? (
                 <div className="flex-1 overflow-auto bg-white border border-slate-200 rounded-lg p-0 flex flex-col">
                   <form onSubmit={handleSubmitItem} className="bg-red-50 p-3 border-b border-red-100 grid grid-cols-4 gap-2 items-end">
                       <div>
                         <label className="text-xs text-red-700 block mb-1">Nama Barang</label>
                         <input type="text" className="w-full text-sm border border-red-200 p-1 rounded" placeholder="Nama Item Baru" value={newItem.name} onChange={e=>setNewItem({...newItem, name: e.target.value})} required />
                       </div>
                       <div>
                         <label className="text-xs text-red-700 block mb-1">Stok Awal</label>
                         <input type="number" className="w-full text-sm border border-red-200 p-1 rounded" placeholder="0" value={newItem.stock || ''} onChange={e=>setNewItem({...newItem, stock: parseInt(e.target.value)})} required />
                       </div>
                       <div>
                         <label className="text-xs text-red-700 block mb-1">Reorder Level</label>
                         <input type="number" className="w-full text-sm border border-red-200 p-1 rounded" placeholder="100" value={newItem.reorder || ''} onChange={e=>setNewItem({...newItem, reorder: parseInt(e.target.value)})} />
                       </div>
                       <button type="submit" className="bg-red-600 text-white text-sm py-1.5 rounded hover:bg-red-700">Tambah Item</button>
                   </form>

                   <div className="flex-1 overflow-auto">
                     <table className="w-full text-sm text-left">
                       <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                         <tr>
                           <th className="px-3 py-2">ID Item</th>
                           <th className="px-3 py-2">Nama Barang</th>
                           <th className="px-3 py-2 text-right">Stok Saat Ini (Edit)</th>
                           <th className="px-3 py-2 text-right">Min. Order</th>
                           <th className="px-3 py-2">Status</th>
                         </tr>
                       </thead>
                       <tbody className="text-slate-700">
                         {inventory.map((item) => (
                           <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                             <td className="px-3 py-2 font-medium text-slate-500">{item.id}</td>
                             <td className="px-3 py-2 font-medium">{item.name}</td>
                             <td className="px-3 py-2 text-right">
                               <input 
                                 type="number" 
                                 className="border rounded w-20 text-right px-1 py-0.5 focus:ring-2 focus:ring-sky-500"
                                 value={item.stock}
                                 onChange={(e) => onUpdateStock(item.name, parseInt(e.target.value) || 0)}
                               />
                             </td>
                             <td className="px-3 py-2 text-right">{item.reorder}</td>
                             <td className="px-3 py-2">
                               {item.stock <= item.reorder ? (
                                 <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-bold">KRITIS</span>
                               ) : (
                                 <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">AMAN</span>
                               )}
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 </div>
              ) : (
                <div className="flex-1 w-full min-h-[300px]">
                  <ChartContainer>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <BarChart layout="vertical" data={inventory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" fontSize={12} />
                        <YAxis dataKey="name" type="category" width={90} fontSize={11} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="stock" fill="#0ea5e9" name="Stok" />
                        <Bar dataKey="reorder" fill="#f43f5e" name="Min. Order" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              )}
            </div>
          )}

          {activeCapability === 'DATABASE_PEMASOK' && (
             <div className="flex-1 min-h-0 flex flex-col bg-white border border-slate-200 rounded-lg overflow-hidden">
                <h3 className="text-sm font-semibold p-3 bg-slate-50 border-b border-slate-200">Database Pemasok Terverifikasi</h3>
                
                <form onSubmit={handleSubmitSupplier} className="p-3 bg-slate-50 border-b border-slate-200 grid grid-cols-4 gap-2 items-end">
                    <div>
                         <label className="text-xs text-slate-500 block mb-1">Nama Pemasok</label>
                         <input type="text" className="w-full text-sm border p-1 rounded" value={newSupplier.name} onChange={e=>setNewSupplier({...newSupplier, name: e.target.value})} required />
                    </div>
                    <div>
                         <label className="text-xs text-slate-500 block mb-1">Material</label>
                         <input type="text" className="w-full text-sm border p-1 rounded" value={newSupplier.material} onChange={e=>setNewSupplier({...newSupplier, material: e.target.value})} placeholder="Benang, Kain..." required />
                    </div>
                    <div>
                         <label className="text-xs text-slate-500 block mb-1">Kontak</label>
                         <input type="text" className="w-full text-sm border p-1 rounded" value={newSupplier.contact} onChange={e=>setNewSupplier({...newSupplier, contact: e.target.value})} />
                    </div>
                    <button type="submit" className="bg-sky-600 text-white text-sm py-1.5 rounded hover:bg-sky-700">Tambah Pemasok</button>
                </form>

                <div className="flex-1 overflow-auto p-0">
                  <table className="w-full text-sm text-left text-slate-600">
                     <thead className="bg-slate-50 text-xs uppercase text-slate-500 sticky top-0">
                       <tr>
                         <th className="px-4 py-3">Nama Pemasok</th>
                         <th className="px-4 py-3">Spesialisasi</th>
                         <th className="px-4 py-3">Rating</th>
                         <th className="px-4 py-3">Kontak</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {suppliers.map((sup) => (
                         <tr key={sup.id} className="hover:bg-slate-50">
                           <td className="px-4 py-3 font-medium text-slate-800">{sup.name}</td>
                           <td className="px-4 py-3">{sup.material}</td>
                           <td className="px-4 py-3 text-amber-500">★ {sup.rating}</td>
                           <td className="px-4 py-3 font-mono text-xs">{sup.contact}</td>
                         </tr>
                       ))}
                     </tbody>
                  </table>
                </div>
             </div>
          )}

          {(!activeCapability || activeCapability === 'BUAT_PO' || activeCapability === 'DATA_PO') && activeCapability !== 'STOK_RENDAH' && activeCapability !== 'DATABASE_PEMASOK' && (
            <div className="flex-1 min-h-0 flex flex-col border-t border-slate-100 pt-4">
               <h3 className="text-sm font-semibold mb-3 text-slate-700">
                 {activeCapability === 'DATA_PO' ? 'Riwayat Pesanan Pembelian' : 'Pesanan Pembelian (PO)'}
               </h3>
               
               {activeCapability === 'BUAT_PO' && (
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
                    <h3 className="text-lg font-bold text-slate-700 mb-4">Buat Purchase Order Baru</h3>
                    <form onSubmit={handleSubmitPO} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Pilih Pemasok</label>
                          <select className="w-full p-2 border border-slate-300 rounded text-sm bg-white" value={newPO.supplier} onChange={e=>setNewPO({...newPO, supplier: e.target.value})} required>
                            <option value="">-- Pilih Pemasok --</option>
                            {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Tanggal Kirim</label>
                          <input type="date" className="w-full p-2 border border-slate-300 rounded text-sm bg-white" value={newPO.date} onChange={e=>setNewPO({...newPO, date: e.target.value})} required />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Item Barang</label>
                        <input type="text" className="w-full p-2 border border-slate-300 rounded text-sm bg-white" placeholder="Nama Barang & Qty" value={newPO.items} onChange={e=>setNewPO({...newPO, items: e.target.value})} required />
                      </div>
                      <div className="pt-2">
                        <button type="submit" className="w-full bg-sky-600 text-white py-2 rounded font-semibold hover:bg-sky-700 transition-colors">
                          Generate PO
                        </button>
                      </div>
                    </form>
                  </div>
               )}

               <div className="overflow-auto flex-1">
                 <table className="w-full text-sm text-left text-slate-600">
                   <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                     <tr>
                       <th className="px-3 py-2">ID PO</th>
                       <th className="px-3 py-2">Tanggal</th>
                       <th className="px-3 py-2">Supplier</th>
                       <th className="px-3 py-2">Item Utama</th>
                       <th className="px-3 py-2">Status</th>
                     </tr>
                   </thead>
                   <tbody>
                     {purchaseOrders.map((po) => (
                       <tr key={po.id} className="border-b border-slate-100 hover:bg-slate-50">
                         <td className="px-3 py-2 font-medium text-slate-900">{po.id}</td>
                         <td className="px-3 py-2 text-slate-500">{po.date}</td>
                         <td className="px-3 py-2">{po.supplier}</td>
                         <td className="px-3 py-2">{po.items}</td>
                         <td className="px-3 py-2">
                            {onUpdatePurchaseStatus ? (
                              <select
                                value={po.status}
                                onChange={(e) => onUpdatePurchaseStatus(po.id, e.target.value as any)}
                                className={`text-xs font-medium rounded-full px-2 py-1 border-0 cursor-pointer focus:ring-2 focus:ring-sky-500 ${getStatusColor(po.status)}`}
                              >
                                <option value="Baru">Baru</option>
                                <option value="Proses">Proses</option>
                                <option value="Dikirim">Dikirim</option>
                                <option value="Diterima">Diterima</option>
                              </select>
                            ) : (
                              renderStatus(po.status)
                            )}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}
        </>
      )}

      {/* --- MANUFACTURING COST ACCOUNTING --- */}
      {activeAgent === AgentType.MANUFACTURING_COST_ACCOUNTING && (
        <div className="h-full flex flex-col gap-4">
          
          {(!activeCapability || activeCapability === 'HPP_JOB_ORDER') && (
            <>
              <h3 className="text-lg font-semibold text-slate-700">Edit Komposisi Biaya (Job Order #1024)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                 {costs.map((c) => (
                    <div key={c.name} className="bg-slate-50 p-2 border rounded">
                       <label className="text-xs text-slate-500 block">{c.name}</label>
                       <input 
                         type="number" 
                         className="w-full text-sm font-bold bg-transparent border-b border-slate-300 focus:border-orange-500 outline-none"
                         value={c.value}
                         onChange={(e) => onUpdateCost(c.name, parseInt(e.target.value) || 0)}
                       />
                    </div>
                 ))}
                 
                 {/* Add new Cost Component Form */}
                 <form onSubmit={handleSubmitCost} className="bg-orange-50 p-2 border rounded border-orange-200">
                    <label className="text-xs text-orange-700 block mb-1 font-bold">Tambah Komponen</label>
                    <div className="flex gap-1 mb-1">
                      <input type="text" placeholder="Nama" className="w-1/2 text-xs border rounded p-1" value={newCost.name} onChange={e=>setNewCost({...newCost, name: e.target.value})} required/>
                      <input type="number" placeholder="Nilai" className="w-1/2 text-xs border rounded p-1" value={newCost.value || ''} onChange={e=>setNewCost({...newCost, value: parseInt(e.target.value)})} required/>
                    </div>
                    <button type="submit" className="w-full bg-orange-500 text-white text-xs py-1 rounded hover:bg-orange-600">Tambah</button>
                 </form>
              </div>

              <div className="flex-1 w-full min-h-[300px]">
                <ChartContainer>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <PieChart>
                      <Pie
                        data={costs}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {costs.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => fmt(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
              <div className="bg-orange-50 p-4 rounded text-sm border border-orange-100">
                <p><strong>Total HPP:</strong> {fmt(costs.reduce((a,b)=>a+b.value, 0))}</p>
                <p><strong>Unit Diproduksi:</strong> 2.000 Pcs</p>
                <p className="text-lg text-orange-800 font-bold mt-2">HPP Per Unit: {fmt(costs.reduce((a,b)=>a+b.value, 0) / 2000)}</p>
              </div>
            </>
          )}

          {activeCapability === 'ALOKASI_OVERHEAD' && (
             <div className="flex-1 flex flex-col h-full overflow-hidden">
                <h3 className="text-lg font-semibold mb-4 text-slate-700">Input & Alokasi Overhead Pabrik</h3>
                
                <form onSubmit={handleSubmitOverhead} className="bg-yellow-50 p-3 rounded mb-4 grid grid-cols-4 gap-2 items-end border border-yellow-200">
                   <div>
                     <label className="text-xs text-slate-600 mb-1 block">Kategori Biaya</label>
                     <input type="text" className="w-full text-sm p-1 rounded border" value={newOverhead.category} onChange={e=>setNewOverhead({...newOverhead, category: e.target.value})} placeholder="Contoh: Sewa" required/>
                   </div>
                   <div>
                     <label className="text-xs text-slate-600 mb-1 block">Basis Alokasi</label>
                     <input type="text" className="w-full text-sm p-1 rounded border" value={newOverhead.basis} onChange={e=>setNewOverhead({...newOverhead, basis: e.target.value})} placeholder="Contoh: Luas Area" required/>
                   </div>
                   <div>
                     <label className="text-xs text-slate-600 mb-1 block">Jumlah (Rp)</label>
                     <input type="number" className="w-full text-sm p-1 rounded border" value={newOverhead.amount || ''} onChange={e=>setNewOverhead({...newOverhead, amount: parseInt(e.target.value)})} placeholder="0" required/>
                   </div>
                   <button type="submit" className="bg-orange-500 text-white text-sm py-1.5 rounded hover:bg-orange-600">Tambah Biaya</button>
                </form>

                <div className="flex-1 overflow-auto bg-white border border-slate-200 rounded-lg">
                   <table className="w-full text-sm text-left">
                     <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                       <tr>
                         <th className="px-4 py-3">Kategori Biaya</th>
                         <th className="px-4 py-3">Basis Alokasi</th>
                         <th className="px-4 py-3 text-right">Jumlah</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {overhead.map((ov, idx) => (
                         <tr key={idx}>
                           <td className="px-4 py-3 font-medium text-slate-700">{ov.category}</td>
                           <td className="px-4 py-3 text-slate-500">{ov.basis}</td>
                           <td className="px-4 py-3 text-right font-mono">{fmt(ov.amount)}</td>
                         </tr>
                       ))}
                       <tr className="bg-orange-50 font-bold text-slate-800">
                         <td className="px-4 py-3" colSpan={2}>Total Overhead</td>
                         <td className="px-4 py-3 text-right">{fmt(overhead.reduce((a,b)=>a+b.amount,0))}</td>
                       </tr>
                     </tbody>
                   </table>
                </div>
             </div>
          )}

          {activeCapability === 'VALUASI_WIP' && (
             <div className="flex-1 flex flex-col h-full">
                <h3 className="text-lg font-semibold mb-2 text-slate-700">Valuasi Barang Dalam Proses (WIP)</h3>
                <div className="flex-1 w-full min-h-[300px]">
                  <ChartContainer>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <BarChart data={wipData} layout="vertical" margin={{ left: 20 }}>
                         <CartesianGrid strokeDasharray="3 3" />
                         <XAxis type="number" fontSize={12} tickFormatter={(val) => `Rp${val/1000000}jt`} />
                         <YAxis dataKey="name" type="category" fontSize={12} width={80} />
                         <Tooltip formatter={(value: number) => fmt(value)} />
                         <Legend />
                         <Bar dataKey="value" fill="#f97316" name="Nilai Persediaan (Rp)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                   <div className="bg-white p-3 border border-slate-200 rounded">
                     <p className="text-xs text-slate-500">Total WIP</p>
                     <p className="text-xl font-bold text-slate-800">{fmt(wipData.reduce((a,b)=>a+b.value,0))}</p>
                   </div>
                   <div className="bg-white p-3 border border-slate-200 rounded">
                     <p className="text-xs text-slate-500">Progress Produksi</p>
                     <p className="text-xl font-bold text-green-600">65%</p>
                   </div>
                </div>
             </div>
          )}
        </div>
      )}

      {/* --- FINANCIAL REPORTING --- */}
      {activeAgent === AgentType.FINANCIAL_REPORTING && (
        <div className="h-full flex flex-col overflow-auto">
          
          {(!activeCapability || activeCapability === 'ARUS_KAS') && (
             <div className="flex-1 flex flex-col h-full">
               <h3 className="text-lg font-semibold mb-2 text-slate-700">Grafik Arus Kas (30 Hari Terakhir)</h3>
               <div className="h-64 min-h-[250px] w-full flex-shrink-0">
                  <ChartContainer height={250}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <LineChart data={cashFlowData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="inflow" stroke="#10b981" strokeWidth={2} name="Pemasukan" />
                        <Line type="monotone" dataKey="outflow" stroke="#ef4444" strokeWidth={2} name="Pengeluaran" />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
               </div>
             </div>
          )}

          {activeCapability === 'NERACA' && (
            <div className="flex flex-col h-full overflow-y-auto pr-2">
              <h3 className="text-lg font-semibold mb-4 text-slate-700 sticky top-0 bg-white z-10 py-2 border-b">Laporan Posisi Keuangan & Laba Rugi</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Balance Sheet: Assets */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-600 border-b border-slate-300 pb-2 mb-2">ASET</h4>
                  <table className="w-full text-sm">
                    <tbody>
                      {balanceSheet.assets.map((item, i) => (
                        <tr key={i} className="border-b border-slate-100 last:border-0">
                          <td className="py-1 text-slate-600">{item.name}</td>
                          <td className="py-1 text-right font-medium text-slate-800">{fmt(item.value)}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-slate-300">
                        <td className="py-2 font-bold text-slate-700">Total Aset</td>
                        <td className="py-2 text-right font-bold text-slate-900">
                           {fmt(balanceSheet.assets.reduce((a,b)=>a+b.value,0))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Balance Sheet: Liabilities & Equity */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-600 border-b border-slate-300 pb-2 mb-2">LIABILITAS & EKUITAS</h4>
                  <table className="w-full text-sm">
                    <tbody>
                      {balanceSheet.liabilities.map((item, i) => (
                        <tr key={i} className="border-b border-slate-100">
                          <td className="py-1 text-slate-600">{item.name}</td>
                          <td className="py-1 text-right font-medium text-slate-800">{fmt(item.value)}</td>
                        </tr>
                      ))}
                       {balanceSheet.equity.map((item, i) => (
                        <tr key={i+10} className="border-b border-slate-100">
                          <td className="py-1 text-slate-600">{item.name}</td>
                          <td className="py-1 text-right font-medium text-slate-800">{fmt(item.value)}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-slate-300">
                        <td className="py-2 font-bold text-slate-700">Total Liabilitas & Ekuitas</td>
                        <td className="py-2 text-right font-bold text-slate-900">
                           {fmt(balanceSheet.liabilities.reduce((a,b)=>a+b.value,0) + balanceSheet.equity.reduce((a,b)=>a+b.value,0))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Income Statement */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <h4 className="text-sm font-bold text-slate-600 border-b border-slate-300 pb-2 mb-2">LABA RUGI (Ringkasan)</h4>
                <table className="w-full text-sm">
                   <tbody>
                     {incomeStatement.map((row, i) => (
                       <tr key={i} className={`
                          ${row.type === 'total' ? 'bg-slate-100 font-bold' : ''} 
                          ${row.type === 'grand_total' ? 'bg-emerald-50 text-emerald-800 font-bold text-md border-t-2 border-emerald-200' : 'border-b border-slate-100'}
                       `}>
                         <td className="py-2 px-2">{row.item}</td>
                         <td className="py-2 px-2 text-right">
                           {row.value < 0 ? `(${fmt(Math.abs(row.value))})` : fmt(row.value)}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                </table>
              </div>
            </div>
          )}

          {activeCapability === 'AUDIT_TRAIL' && (
            <div className="flex flex-col h-full overflow-hidden">
               <h3 className="text-lg font-semibold mb-4 text-slate-700">Audit Trail Generator</h3>
               <div className="flex-1 overflow-auto bg-white border border-slate-200 rounded-lg">
                 <table className="w-full text-sm text-left text-slate-600">
                   <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                     <tr>
                       <th className="px-4 py-3">Waktu</th>
                       <th className="px-4 py-3">User</th>
                       <th className="px-4 py-3">Aksi</th>
                       <th className="px-4 py-3">Referensi</th>
                       <th className="px-4 py-3">Detail</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {auditTrailLogs.map((log) => (
                       <tr key={log.id} className="hover:bg-slate-50">
                         <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-xs">{log.time}</td>
                         <td className="px-4 py-3 font-medium text-slate-700">{log.user}</td>
                         <td className="px-4 py-3">
                           <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs border border-indigo-100">
                             {log.action}
                           </span>
                         </td>
                         <td className="px-4 py-3 text-slate-500">{log.ref}</td>
                         <td className="px-4 py-3 text-slate-500 truncate max-w-xs">{log.details}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Visualizations;