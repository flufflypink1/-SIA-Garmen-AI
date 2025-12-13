import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AgentType, RouteResult } from "../types";

// Helper untuk inisialisasi AI yang aman
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === '""' || apiKey.includes('YOUR_API_KEY')) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * MOCK LOGIC: Digunakan jika tidak ada API Key
 */
const getMockRoute = (query: string): RouteResult => {
  const lower = query.toLowerCase();
  
  if (lower.includes('faktur') || lower.includes('jual') || lower.includes('pendapatan') || lower.includes('pesanan')) {
    return { targetAgent: AgentType.SALES_AND_REVENUE, reasoning: "[DEMO] Terdeteksi kata kunci penjualan/faktur." };
  }
  if (lower.includes('beli') || lower.includes('stok') || lower.includes('sedia') || lower.includes('pemasok') || lower.includes('supplier')) {
    return { targetAgent: AgentType.PURCHASING_AND_INVENTORY, reasoning: "[DEMO] Terdeteksi kata kunci pembelian/stok." };
  }
  if (lower.includes('hpp') || lower.includes('biaya') || lower.includes('wip') || lower.includes('overhead') || lower.includes('produksi')) {
    return { targetAgent: AgentType.MANUFACTURING_COST_ACCOUNTING, reasoning: "[DEMO] Terdeteksi kata kunci biaya produksi/HPP." };
  }
  if (lower.includes('laba') || lower.includes('rugi') || lower.includes('neraca') || lower.includes('uang') || lower.includes('laporan')) {
    return { targetAgent: AgentType.FINANCIAL_REPORTING, reasoning: "[DEMO] Terdeteksi kata kunci laporan keuangan." };
  }

  return { targetAgent: AgentType.ROUTER, reasoning: "[DEMO] Menggunakan agen default." };
};

/**
 * Step 1: Router Agent
 */
export const routeQuery = async (query: string): Promise<RouteResult> => {
  const ai = getAI();
  
  // Jika tidak ada API Key, gunakan Mock
  if (!ai) {
    console.warn("API Key missing, using Mock Router");
    return getMockRoute(query);
  }

  const systemInstruction = `
Sebagai Agen Utama dalam Sistem Informasi Akuntansi (SIA) Manufaktur Garmen, peran Anda adalah menjadi router cerdas.

DEFINISI SUB-AGEN:
1. SALES_AND_REVENUE: Faktur, Penjualan, Pendapatan.
2. PURCHASING_AND_INVENTORY: Stok, Bahan Baku, Pemasok, PO.
3. FINANCIAL_REPORTING: Laporan Keuangan, Neraca, Laba Rugi, Arus Kas.
4. MANUFACTURING_COST_ACCOUNTING: HPP, Biaya Produksi, Overhead, WIP.

Pilih salah satu agen berdasarkan input user.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      targetAgent: {
        type: Type.STRING,
        enum: [
          AgentType.SALES_AND_REVENUE,
          AgentType.PURCHASING_AND_INVENTORY,
          AgentType.FINANCIAL_REPORTING,
          AgentType.MANUFACTURING_COST_ACCOUNTING,
        ],
      },
      reasoning: {
        type: Type.STRING,
        description: "Alasan pemilihan agen.",
      },
    },
    required: ["targetAgent", "reasoning"],
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text || "{}";
    return JSON.parse(jsonText) as RouteResult;

  } catch (error) {
    console.error("Routing error:", error);
    return getMockRoute(query); // Fallback ke mock jika API error
  }
};

/**
 * Step 2: Specialist Agent
 */
export const generateAgentResponse = async (
  agent: AgentType,
  query: string
): Promise<string> => {
  const ai = getAI();

  // Mock Response jika tidak ada API Key
  if (!ai) {
    return `### Mode Simulasi (Demo)\n\nSistem mendeteksi bahwa **API Key belum dikonfigurasi**. \n\nKarena ini adalah demo, saya mensimulasikan respon untuk agen **${agent}**. Dalam versi live dengan API Key aktif, saya akan memberikan analisis mendalam tentang: "${query}".\n\nSilakan lihat panel visualisasi di sebelah kanan untuk data interaktif.`;
  }

  let systemInstruction = "";
  const formatInstruction = " SAJIKAN DATA DALAM BENTUK TABEL MARKDOWN AGAR MUDAH DIBACA.";

  switch (agent) {
    case AgentType.SALES_AND_REVENUE:
      systemInstruction = "Anda adalah Agen Penjualan & Pendapatan. Kelola faktur dan pesanan." + formatInstruction;
      break;
    case AgentType.PURCHASING_AND_INVENTORY:
      systemInstruction = "Anda adalah Agen Pembelian & Inventaris. Kelola stok dan pemasok." + formatInstruction;
      break;
    case AgentType.FINANCIAL_REPORTING:
      systemInstruction = "Anda adalah Agen Laporan Keuangan. Sajikan Neraca/Laba Rugi." + formatInstruction;
      break;
    case AgentType.MANUFACTURING_COST_ACCOUNTING:
      systemInstruction = "Anda adalah Agen Akuntansi Biaya. Hitung HPP dan Overhead." + formatInstruction;
      break;
    default:
      systemInstruction = "Anda adalah asisten akuntansi umum." + formatInstruction;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    return response.text || "Maaf, tidak ada respon.";
  } catch (error) {
    console.error("Generation error:", error);
    return "Maaf, terjadi kesalahan koneksi API. Pastikan kuota tersedia atau API Key valid.";
  }
};