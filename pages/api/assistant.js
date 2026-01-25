export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { message } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "API Key belum dipasang di Vercel!" });
  }

  try {
    // KITA PAKAI MODEL YANG PASTI JALAN: gemini-1.5-flash
    // Jangan ganti ke 2.5 dulu ya, biar jalan dulu fiturnya
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Kamu adalah asisten pribadi bernama Dean. 
            Analisis kalimat user: "${message}".
            
            DAFTAR PERINTAH (Output HARUS JSON):
            1. Buka Aplikasi -> {"action": "OPEN_APP", "target": "NamaAplikasi"}
            2. Putar Lagu -> {"action": "PLAY_MUSIC", "query": "Judul Lagu/Artis"}
            3. Ambil Foto -> {"action": "TAKE_PHOTO"}
            
            Jika tidak ada perintah di atas, balas dengan teks chat biasa.
            Jaga jawabanmu tetap singkat dan santai.`
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Google Error:", errorData); // Ini akan muncul di Log Vercel kalau error lagi
      throw new Error(`Google menolak request: ${response.status}`);
    }

    const data = await response.json();
    
    // Ambil teks jawaban dari Google
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Bersihkan format JSON kalau ada backticks
    const cleanJson = resultText.replace(/```json|```/g, '').trim();

    try {
      // Coba baca sebagai perintah (JSON)
      const jsonResponse = JSON.parse(cleanJson);
      res.status(200).json(jsonResponse); 
    } catch (e) {
      // Kalau bukan JSON, kirim sebagai chat biasa
      res.status(200).json({ action: "CHAT", reply: resultText });
    }

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Otak sedang lag (Cek API Key / Model Name)" });
  }
}
