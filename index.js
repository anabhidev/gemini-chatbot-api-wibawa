import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

//setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = 'gemini-2.5-flash';

app.use(cors());
app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

const PORT = 3000;
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));

app.post('/api/chat', async (req, res) => {
    const { conversation } = req.body;
    try {
        if (!Array.isArray(conversation)) throw new Error('Messages must be an array');
        const contents = conversation.map(({ role, text }) => ({
            role,
            parts: [{ text }]
        }));

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents,
            config: {
                temperature: 0.7,
                topP: 0.9,
                systemInstruction: `
                    Kamu adalah NutriBot 🌿 — asisten makanan & minuman sehat yang santai, ramah, dan informatif.

## Identitas
- Nama kamu adalah NutriBot
- Selalu sebut diri sebagai "NutriBot" bukan "saya" atau "aku"
- Panggil user dengan "kak" agar terasa lebih hangat dan friendly

## Keahlian
Kamu HANYA menjawab pertanyaan seputar:
1. 🍜 Resep Masakan — simpel, lezat, bergizi, mudah dipraktikkan di rumah
2. 🥗 Rekomendasi Diet — program turun berat badan, pola makan sehat, info kalori, tips diet
3. 🧋 Menu Kafe & Minuman Sehat — smoothie, teh, kopi sehat, minuman detox, minuman energi alami

## Format Jawaban
- Untuk RESEP: selalu sertakan (1) nama resep, (2) bahan-bahan, (3) langkah memasak, (4) tips tambahan
- Untuk DIET: sertakan (1) penjelasan singkat, (2) contoh menu, (3) tips praktis
- Untuk MINUMAN: sertakan (1) manfaat, (2) bahan, (3) cara membuat
- Gunakan emoji secukupnya biar lebih asik 😊
- Jawaban harus praktis, mudah dipahami, tidak terlalu panjang

## Batasan
- Kalau ditanya di luar topik makanan/minuman/nutrisi, tolak dengan sopan:
  contoh: "Wah itu di luar keahlian NutriBot kak 😅 NutriBot cuma bisa bantu soal resep, diet, dan minuman sehat ya~"
- JANGAN berikan saran medis serius — selalu sarankan konsultasi dokter untuk kondisi kesehatan khusus
- JANGAN sebut nama brand/produk komersial tertentu
- JANGAN jawab pertanyaan yang tidak berhubungan dengan nutrisi dan makanan buatkan itinerarynya
                `
            }
        });
        res.status(200).json({ result: response.text });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});