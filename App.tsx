import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Factory, 
  FileText, 
  Send, 
  Bot, 
  User, 
  Box,
  ArrowRightLeft
} from 'lucide-react';
import { AgentType, ChatMessage, SalesOrder, InventoryItem, CostData, OverheadItem, Supplier, PurchaseOrder } from './types';
import { routeQuery, generateAgentResponse } from './services/gemini';
import Visualizations from './components/Visualizations';

// --- Initial Data ---
const initialSalesOrders: SalesOrder[] = [
  { id: 'SO-1024', client: 'PT. Mode Indonesia', date: '2023-10-24', amount: 12500000, status: 'Selesai' },
  { id: 'SO-1025', client: 'Butik Sederhana', date: '2023-10-25', amount: 3400000, status: 'Proses' },
  { id: 'SO-1026', client: 'Distro Bandung', date: '2023-10-26', amount: 8900000, status: 'Menunggu' },
  { id: 'SO-1027', client: 'Online Shop A', date: '2023-10-27', amount: 1500000, status: 'Proses' },
  { id: 'SO-1028', client: 'Retail Jakarta', date: '2023-10-27', amount: 45000000, status: 'Baru' },
];

const initialInventory: InventoryItem[] = [
  { id: '1', name: 'Kain Katun', stock: 4000, reorder: 1000 },
  { id: '2', name: 'Benang Poly', stock: 3000, reorder: 500 },
  { id: '3', name: 'Kancing', stock: 2000, reorder: 2000 },
  { id: '4', name: 'Resleting', stock: 2780, reorder: 800 },
  { id: '5', name: 'Label', stock: 1890, reorder: 1500 },
];

const initialCosts: CostData[] = [
  { name: 'Bahan Baku', value: 45000000 },
  { name: 'Tenaga Kerja', value: 30000000 },
  { name: 'Overhead', value: 15000000 },
];

const initialOverhead: OverheadItem[] = [
  { category: 'Listrik & Air Pabrik', amount: 5500000, basis: 'Kwh/M3' },
  { category: 'Sewa Gedung Pabrik', amount: 4000000, basis: 'Luas Area' },
  { category: 'Depresiasi Mesin', amount: 3500000, basis: 'Jam Mesin' },
  { category: 'Bahan Penolong', amount: 2000000, basis: 'Unit' },
];

const initialSuppliers: Supplier[] = [
  { id: 'SUP-01', name: 'CV. Tekstil Jaya', material: 'Kain Katun, Rayon', rating: 4.8, contact: '0812-xxxx-xxxx' },
  { id: 'SUP-02', name: 'Toko Benang Abadi', material: 'Benang Poly, Nilon', rating: 4.5, contact: '0813-xxxx-xxxx' },
];

const initialPOs: PurchaseOrder[] = [
  { id: 'PO-5001', supplier: 'CV. Tekstil Jaya', date: '2023-10-20', items: 'Kain Cotton Combed 30s', status: 'Diterima' },
  { id: 'PO-5002', supplier: 'Toko Benang Abadi', date: '2023-10-22', items: 'Benang Polyester 5000y', status: 'Dikirim' },
  { id: 'PO-5003', supplier: 'Aksesoris Garmen', date: '2023-10-25', items: 'Kancing Kemeja 10mm', status: 'Proses' },
  { id: 'PO-5004', supplier: 'CV. Tekstil Jaya', date: '2023-10-28', items: 'Kain Rayon Viscose', status: 'Baru' },
  { id: 'PO-5005', supplier: 'Logam Mulia Zipper', date: '2023-10-29', items: 'Resleting YKK 25cm', status: 'Proses' },
];

const App: React.FC = () => {
  // --- Chat State ---
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Halo! Saya adalah Manajer Operasional Akuntansi Garmen. Ada yang bisa saya bantu terkait Penjualan, Inventaris, Laporan Keuangan, atau Biaya Produksi?',
      timestamp: Date.now(),
      agent: AgentType.ROUTER
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeAgent, setActiveAgent] = useState<AgentType>(AgentType.ROUTER);
  const [activeCapability, setActiveCapability] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Data State (Editable) ---
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(initialSalesOrders);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [costs, setCosts] = useState<CostData[]>(initialCosts);
  const [overhead, setOverhead] = useState<OverheadItem[]>(initialOverhead);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(initialPOs);

  // --- Handlers ---
  const handleAddSalesOrder = (order: SalesOrder) => {
    setSalesOrders(prev => [order, ...prev]);
  };

  const handleUpdateSalesStatus = (id: string, newStatus: SalesOrder['status']) => {
    setSalesOrders(prev => prev.map(order => 
      order.id === id ? { ...order, status: newStatus } : order
    ));
  };

  const handleUpdateStock = (name: string, newStock: number) => {
    setInventory(prev => prev.map(item => 
      item.name === name ? { ...item, stock: newStock } : item
    ));
  };

  const handleAddInventoryItem = (item: InventoryItem) => {
    setInventory(prev => [...prev, item]);
  };

  const handleUpdateCost = (name: string, newValue: number) => {
    setCosts(prev => prev.map(item =>
      item.name === name ? { ...item, value: newValue } : item
    ));
  };

  const handleAddCostComponent = (cost: CostData) => {
    setCosts(prev => [...prev, cost]);
  };

  const handleAddOverhead = (item: OverheadItem) => {
    setOverhead(prev => [...prev, item]);
  };

  const handleAddSupplier = (supplier: Supplier) => {
    setSuppliers(prev => [...prev, supplier]);
  };

  const handleAddPurchaseOrder = (po: PurchaseOrder) => {
    setPurchaseOrders(prev => [po, ...prev]);
  };

  const handleUpdatePurchaseStatus = (id: string, newStatus: PurchaseOrder['status']) => {
    setPurchaseOrders(prev => prev.map(po => 
      po.id === id ? { ...po, status: newStatus } : po
    ));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAgentChange = (agent: AgentType) => {
    setActiveAgent(agent);
    setActiveCapability(null); // Reset capability view when switching agents
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const route = await routeQuery(userMsg.content);
      setActiveAgent(route.targetAgent);
      setActiveCapability(null);

      const routingMsg: ChatMessage = {
        id: Date.now().toString() + '-route',
        role: 'system',
        content: `Mengarahkan ke **${formatAgentName(route.targetAgent)}**: ${route.reasoning}`,
        timestamp: Date.now(),
        agent: AgentType.ROUTER
      };
      setMessages(prev => [...prev, routingMsg]);

      const responseText = await generateAgentResponse(route.targetAgent, userMsg.content);
      
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: Date.now(),
        agent: route.targetAgent
      };

      setMessages(prev => [...prev, assistantMsg]);

    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'system',
        content: "Maaf, terjadi kesalahan koneksi dengan layanan AI. Pastikan API KEY telah dikonfigurasi.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatAgentName = (agent: AgentType) => {
    switch (agent) {
      case AgentType.SALES_AND_REVENUE: return 'Penjualan & Pendapatan';
      case AgentType.PURCHASING_AND_INVENTORY: return 'Pembelian & Inventaris';
      case AgentType.MANUFACTURING_COST_ACCOUNTING: return 'Akuntansi Biaya Manufaktur';
      case AgentType.FINANCIAL_REPORTING: return 'Pelaporan Keuangan';
      default: return 'Manajer Operasional';
    }
  };

  const getAgentIcon = (agent: AgentType) => {
    switch (agent) {
      case AgentType.SALES_AND_REVENUE: return <ShoppingCart className="w-5 h-5 text-indigo-600" />;
      case AgentType.PURCHASING_AND_INVENTORY: return <Box className="w-5 h-5 text-sky-500" />;
      case AgentType.MANUFACTURING_COST_ACCOUNTING: return <Factory className="w-5 h-5 text-orange-500" />;
      case AgentType.FINANCIAL_REPORTING: return <FileText className="w-5 h-5 text-emerald-600" />;
      default: return <LayoutDashboard className="w-5 h-5 text-slate-500" />;
    }
  };

  const getAgentColor = (agent?: AgentType) => {
    switch (agent) {
      case AgentType.SALES_AND_REVENUE: return 'bg-indigo-50 border-indigo-200';
      case AgentType.PURCHASING_AND_INVENTORY: return 'bg-sky-50 border-sky-200';
      case AgentType.MANUFACTURING_COST_ACCOUNTING: return 'bg-orange-50 border-orange-200';
      case AgentType.FINANCIAL_REPORTING: return 'bg-emerald-50 border-emerald-200';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden text-slate-800">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">S</div>
            <span>SIA Garmen</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Sistem Informasi Akuntansi</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: AgentType.ROUTER, label: 'Dashboard Utama', icon: LayoutDashboard },
            { id: AgentType.SALES_AND_REVENUE, label: 'Penjualan', icon: ShoppingCart },
            { id: AgentType.PURCHASING_AND_INVENTORY, label: 'Inventaris', icon: Box },
            { id: AgentType.MANUFACTURING_COST_ACCOUNTING, label: 'Biaya Produksi', icon: Factory },
            { id: AgentType.FINANCIAL_REPORTING, label: 'Laporan', icon: FileText },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleAgentChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                activeAgent === item.id 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
          Powered by Gemini 2.5 Flash
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            {getAgentIcon(activeAgent)}
            {formatAgentName(activeAgent)}
          </h1>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-green-500'}`}></div>
            System Online
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          
          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-slate-50 max-w-3xl border-r border-slate-200">
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-indigo-100 text-indigo-700' : 
                    msg.role === 'system' ? 'bg-slate-200 text-slate-600' : 'bg-white border border-slate-200'
                  }`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : 
                     msg.role === 'system' ? <ArrowRightLeft className="w-4 h-4" /> :
                     <Bot className="w-4 h-4 text-indigo-600" />}
                  </div>

                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed overflow-x-auto ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white' 
                      : msg.role === 'system' 
                      ? 'bg-slate-100 text-slate-500 text-xs italic border border-slate-200'
                      : `bg-white text-slate-700 border ${getAgentColor(msg.agent)}`
                  }`}>
                    {msg.role === 'assistant' && msg.agent && msg.agent !== AgentType.ROUTER && (
                       <div className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">
                         {formatAgentName(msg.agent)}
                       </div>
                    )}
                    <ReactMarkdown remarkPlugins={[remarkGfm]} className="markdown-content">
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-200">
              <div className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Contoh: 'Berapa HPP untuk batch #1024?' atau 'Buat faktur penjualan baru'"
                  className="w-full pl-4 pr-12 py-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm shadow-inner"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-2 text-center">
                <p className="text-xs text-slate-400">
                  Agen AI akan secara otomatis meneruskan permintaan Anda ke departemen yang relevan.
                </p>
              </div>
            </div>
          </div>

          {/* Visualization / Context Panel */}
          <div className="flex-1 bg-white flex flex-col overflow-hidden">
             <div className="p-4 border-b border-slate-100 flex justify-between items-center">
               <h2 className="font-semibold text-sm text-slate-700">
                  {activeCapability ? `Detail: ${activeCapability.replace(/_/g, ' ')}` : 'Visualisasi Data Langsung'}
               </h2>
               <span className="text-xs text-slate-400">Diperbarui: Baru saja</span>
             </div>
             
             <div className="flex-1 p-2 overflow-hidden flex flex-col min-h-0">
               <Visualizations 
                 activeAgent={activeAgent} 
                 activeCapability={activeCapability}
                 // Pass Data
                 salesOrders={salesOrders}
                 inventory={inventory}
                 costs={costs}
                 overhead={overhead}
                 suppliers={suppliers}
                 purchaseOrders={purchaseOrders}
                 // Pass Handlers
                 onAddSalesOrder={handleAddSalesOrder}
                 onUpdateSalesStatus={handleUpdateSalesStatus}
                 onUpdateStock={handleUpdateStock}
                 onAddInventoryItem={handleAddInventoryItem}
                 onUpdateCost={handleUpdateCost}
                 onAddCostComponent={handleAddCostComponent}
                 onAddOverhead={handleAddOverhead}
                 onAddSupplier={handleAddSupplier}
                 onAddPurchaseOrder={handleAddPurchaseOrder}
                 onUpdatePurchaseStatus={handleUpdatePurchaseStatus}
               />
             </div>
             
             {/* Context Info Box */}
             <div className="h-1/3 border-t border-slate-100 p-6 bg-slate-50 overflow-y-auto">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Kapabilitas Agen Aktif</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  {activeAgent === AgentType.SALES_AND_REVENUE && (
                    <>
                      <li className={`capability-item ${activeCapability === 'FAKTUR_OTOMATIS' ? 'active' : ''}`} onClick={() => setActiveCapability('FAKTUR_OTOMATIS')}>
                        <div className="dot bg-indigo-500"></div>Pembuatan Faktur Otomatis
                      </li>
                      <li className={`capability-item ${activeCapability === 'STATUS_PESANAN' ? 'active' : ''}`} onClick={() => setActiveCapability('STATUS_PESANAN')}>
                        <div className="dot bg-indigo-500"></div>Pelacakan Status Pesanan & Input
                      </li>
                      <li className={`capability-item ${activeCapability === 'ANALISIS_PENDAPATAN' ? 'active' : ''}`} onClick={() => setActiveCapability('ANALISIS_PENDAPATAN')}>
                        <div className="dot bg-indigo-500"></div>Analisis Pendapatan Mingguan
                      </li>
                    </>
                  )}
                  {activeAgent === AgentType.PURCHASING_AND_INVENTORY && (
                    <>
                      <li className={`capability-item ${activeCapability === 'STOK_RENDAH' ? 'active' : ''}`} onClick={() => setActiveCapability('STOK_RENDAH')}>
                        <div className="dot bg-sky-500"></div>Manajemen Stok Bahan Baku (Edit)
                      </li>
                      <li className={`capability-item ${activeCapability === 'DATABASE_PEMASOK' ? 'active' : ''}`} onClick={() => setActiveCapability('DATABASE_PEMASOK')}>
                        <div className="dot bg-sky-500"></div>Manajemen Database Pemasok
                      </li>
                      <li className={`capability-item ${activeCapability === 'BUAT_PO' ? 'active' : ''}`} onClick={() => setActiveCapability('BUAT_PO')}>
                        <div className="dot bg-sky-500"></div>Buat Purchase Order Baru
                      </li>
                      <li className={`capability-item ${activeCapability === 'DATA_PO' ? 'active' : ''}`} onClick={() => setActiveCapability('DATA_PO')}>
                        <div className="dot bg-sky-500"></div>Riwayat Purchase Order
                      </li>
                    </>
                  )}
                  {activeAgent === AgentType.MANUFACTURING_COST_ACCOUNTING && (
                    <>
                      <li className={`capability-item ${activeCapability === 'HPP_JOB_ORDER' ? 'active' : ''}`} onClick={() => setActiveCapability('HPP_JOB_ORDER')}>
                        <div className="dot bg-orange-500"></div>Perhitungan & Edit HPP
                      </li>
                      <li className={`capability-item ${activeCapability === 'ALOKASI_OVERHEAD' ? 'active' : ''}`} onClick={() => setActiveCapability('ALOKASI_OVERHEAD')}>
                        <div className="dot bg-orange-500"></div>Input & Alokasi Biaya Overhead
                      </li>
                      <li className={`capability-item ${activeCapability === 'VALUASI_WIP' ? 'active' : ''}`} onClick={() => setActiveCapability('VALUASI_WIP')}>
                        <div className="dot bg-orange-500"></div>Valuasi Work In Process (WIP)
                      </li>
                    </>
                  )}
                  {activeAgent === AgentType.FINANCIAL_REPORTING && (
                    <>
                      <li className={`capability-item ${activeCapability === 'NERACA' ? 'active' : ''}`} onClick={() => setActiveCapability('NERACA')}>
                        <div className="dot bg-emerald-500"></div>Neraca & Laba Rugi Real-time
                      </li>
                      <li className={`capability-item ${activeCapability === 'ARUS_KAS' ? 'active' : ''}`} onClick={() => setActiveCapability('ARUS_KAS')}>
                        <div className="dot bg-emerald-500"></div>Laporan Arus Kas
                      </li>
                      <li className={`capability-item ${activeCapability === 'AUDIT_TRAIL' ? 'active' : ''}`} onClick={() => setActiveCapability('AUDIT_TRAIL')}>
                        <div className="dot bg-emerald-500"></div>Audit Trail Generator
                      </li>
                    </>
                  )}
                   {activeAgent === AgentType.ROUTER && (
                    <li className="text-slate-400 italic">Silakan kirim pesan atau pilih agen di menu samping.</li>
                  )}
                </ul>
                <style>{`
                  .capability-item { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.25rem; border-radius: 0.25rem; transition: all 0.2s; }
                  .capability-item:hover { background-color: #f1f5f9; color: #4f46e5; }
                  .capability-item.active { font-weight: 600; color: #3730a3; background-color: #e0e7ff; }
                  .dot { width: 0.375rem; height: 0.375rem; border-radius: 9999px; }
                `}</style>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;