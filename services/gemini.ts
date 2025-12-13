import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AgentType, RouteResult } from "../types";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
// The API key is obtained exclusively from the environment variable.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Step 1: Router Agent
 * Decides which sub-agent should handle the user's request.
 */
export const routeQuery = async (query: string): Promise<RouteResult> => {
  const systemInstruction = `
Sebagai Agen Utama dalam Sistem Informasi Akuntansi (SIA) Manufaktur Garmen, peran Anda adalah menjadi router cerdas (Manage Accounting Operations). Anda harus secara konsisten dan akurat mengarahkan permintaan pengguna ke salah satu dari empat Sub-Agen spesialis di bawah.

DEFINISI SUB-AGEN SPESIALIS:
1. SALES_AND_REVENUE: Memproses pesanan penjualan, menghasilkan faktur, dan melacak pendapatan real-time.
2. PURCHASING_AND_INVENTORY: Mengelola pengadaan bahan baku, memantau tingkat persediaan, dan menyediakan informasi pemasok.
3. FINANCIAL_REPORTING: Menghasilkan laporan keuangan formal (Laba Rugi, Neraca, Arus Kas) dan laporan analitis.
4. MANUFACTURING_COST_ACCOUNTING: Menghitung HPP (Harga Pokok Produksi), melacak biaya (bahan baku, tenaga kerja, overhead), dan menilai persediaan WIP/Barang Jadi.

LOGIKA PERUTEAN:
* Jika permintaan terkait FAKTUR, PESANAN PENJUALAN, atau PELACAKAN PENDAPATAN -> SALES_AND_REVENUE.
* Jika permintaan terkait PEMBELIAN BAHAN BAKU, TINGKAT STOK/INVENTARIS, atau INFORMASI PEMASOK -> PURCHASING_AND_INVENTORY.
* Jika permintaan terkait LAPORAN LABA RUGI, NERACA, ARUS KAS, atau KEPATUHAN AKUNTANSI -> FINANCIAL_REPORTING.
* Jika permintaan terkait PERHITUNGAN HPP, BIAYA PRODUKSI, PENGGUNAAN BAHAN BAKU, atau PENILAIAN WIP -> MANUFACTURING_COST_ACCOUNTING.
* Jika tidak jelas, gunakan penilaian terbaik Anda berdasarkan konteks manufaktur garmen.
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
        description: "Penjelasan singkat mengapa agen ini dipilih.",
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
    const result = JSON.parse(jsonText) as RouteResult;
    return result;

  } catch (error) {
    console.error("Routing error:", error);
    // Fallback to General Reporting if routing fails
    return {
      targetAgent: AgentType.FINANCIAL_REPORTING,
      reasoning: "Gagal melakukan routing otomatis, dialihkan ke pelaporan umum.",
    };
  }
};

/**
 * Step 2: Specialist Agent
 * Generates the actual response based on the chosen agent persona.
 */
export const generateAgentResponse = async (
  agent: AgentType,
  query: string
): Promise<string> => {
  let systemInstruction = "";
  const formatInstruction = " SAJIKAN DATA (seperti daftar barang, rincian biaya, atau jurnal) DALAM BENTUK TABEL MARKDOWN AGAR MUDAH DIBACA.";

  switch (agent) {
    case AgentType.SALES_AND_REVENUE:
      systemInstruction = "Anda adalah Agen Penjualan & Pendapatan. Tugas Anda: Mengelola faktur, pesanan penjualan, dan pelacakan pendapatan. Berikan jawaban profesional terkait transaksi penjualan garmen." + formatInstruction;
      break;
    case AgentType.PURCHASING_AND_INVENTORY:
      systemInstruction = "Anda adalah Agen Pembelian & Inventaris. Tugas Anda: Mengelola stok bahan baku (kain, benang, kancing), purchase order, dan pemasok. Berikan data estimasi stok jika diminta." + formatInstruction;
      break;
    case AgentType.FINANCIAL_REPORTING:
      systemInstruction = "Anda adalah Agen Pelaporan Keuangan. Tugas Anda: Menyajikan Laporan Laba Rugi, Neraca, dan Arus Kas. Gunakan bahasa akuntansi formal dan standar." + formatInstruction;
      break;
    case AgentType.MANUFACTURING_COST_ACCOUNTING:
      systemInstruction = "Anda adalah Agen Akuntansi Biaya Manufaktur. Tugas Anda: Menghitung HPP (Harga Pokok Produksi), melacak biaya Job Order, biaya bahan baku, tenaga kerja langsung, dan overhead pabrik. Jelaskan perhitungan biaya secara rinci." + formatInstruction;
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

    return response.text || "Maaf, saya tidak dapat menghasilkan respon saat ini.";
  } catch (error) {
    console.error("Generation error:", error);
    return "Terjadi kesalahan saat memproses permintaan Anda.";
  }
};