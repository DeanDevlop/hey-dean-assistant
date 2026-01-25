export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { message } = req.body;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
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
            Jaga jawabanmu tetap singkat.`
          }]
        }]
      })
    });

    const data = await response.json();
    const resultText = data.candidates[0].content.parts[0].text;
    const cleanJson = resultText.replace(/```json|```/g, '').trim();

    try {
      const jsonResponse = JSON.parse(cleanJson);
      res.status(200).json(jsonResponse); 
    } catch (e) {
      res.status(200).json({ action: "CHAT", reply: resultText });
    }

  } catch (error) {
    res.status(500).json({ error: "Otak sedang lag" });
  }
}
