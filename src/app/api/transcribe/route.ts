import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { audio, mediaType } = await req.json();

    // If OpenAI key is available, use Whisper for transcription
    if (process.env.OPENAI_API_KEY) {
      const blob = Buffer.from(audio, "base64");
      const formData = new FormData();
      formData.append("file", new Blob([blob], { type: mediaType || "audio/webm" }), "audio.webm");
      formData.append("model", "whisper-1");
      formData.append("language", "pt");

      const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ texto: data.text });
      }
    }

    // Fallback: placeholder — user edits before sending
    return NextResponse.json({
      texto: "[Mensagem de voz — edite o texto acima antes de enviar]",
    });
  } catch {
    return NextResponse.json({ texto: "" }, { status: 200 });
  }
}
