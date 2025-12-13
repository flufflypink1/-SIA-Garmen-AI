export enum AgentType {
  ROUTER = 'ROUTER',
  SALES_AND_REVENUE = 'SALES_AND_REVENUE',
  PURCHASING_AND_INVENTORY = 'PURCHASING_AND_INVENTORY',
  FINANCIAL_REPORTING = 'FINANCIAL_REPORTING',
  MANUFACTURING_COST_ACCOUNTING = 'MANUFACTURING_COST_ACCOUNTING',
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agent?: AgentType; // The agent that handled this message
  timestamp: number;
}

export interface RouteResult {
  targetAgent: AgentType;
  reasoning: string;
}

export interface DashboardMetric {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

// --- Data Types for Editing ---

export interface SalesOrder {
  id: string;
  client: string;
  date: string;
  amount: number;
  status: 'Baru' | 'Proses' | 'Dikirim' | 'Selesai' | 'Menunggu';
}

export interface InventoryItem {
  id: string; // e.g., name or code
  name: string;
  stock: number;
  reorder: number; // Reorder point
}

export interface CostData {
  name: string;
  value: number;
}

export interface OverheadItem {
  category: string;
  amount: number;
  basis: string;
}

export interface Supplier {
  id: string;
  name: string;
  material: string;
  rating: number;
  contact: string;
}

export interface PurchaseOrder {
  id: string;
  supplier: string;
  date: string;
  items: string;
  status: 'Baru' | 'Proses' | 'Dikirim' | 'Diterima';
}