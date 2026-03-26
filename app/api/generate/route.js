export async function POST(request) {
  const { reader, client, card } = await request.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });
  }

  const lpn = lifePathNumber(client.birth);

  const prompt = `あなたはタロット占い師です。以下の設定に従ってメッセージを生成してください。

【占い師設定】
- 口調: ${reader.tone}
- キャラクター: ${reader.character}
- 得意テーマ: ${reader.theme}
${reader.banned ? `- 禁止ワード: ${reader.banned}` : ""}

【お客さん情報】
- お名前: ${client.name}
- 生年月日: ${client.birth}（ライフパスナンバー: ${lpn}）
- 相談テーマ: ${client.topic}

【今週のカード】
${card}

以下の3つのメッセージを生成してください。JSONのみで返してください。

{
  "monday": "月曜メッセージ: 今週のカード「${card}」の意味を踏まえ、${client.name}さんの相談テーマ「${client.topic}」に合わせた問いかけを含むメッセージ（150〜250文字）",
  "thursday": "木曜メッセージ: 月曜の問いかけを受けた中間フォローの一言（80〜150文字）",
  "sunday": "日曜メッセージ: 今週の振り返りを促し一言フィードバックを求めるメッセージ（80〜150文字）。来週のカードに反映すると伝える。"
}

JSONのみ返してください。マークダウンや説明は一切不要です。`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      return Response.json(
        { error: `Claude API error: ${resp.status}`, detail: errText.slice(0, 200) },
        { status: 502 }
      );
    }

    const data = await resp.json();
    const txt = data.content?.map((b) => b.text || "").join("") || "";
    const match = txt.match(/\{[\s\S]*\}/);

    if (!match) {
      return Response.json({ error: "Failed to parse response", raw: txt.slice(0, 300) }, { status: 502 });
    }

    const messages = JSON.parse(match[0]);
    return Response.json({ messages, source: "ai" });
  } catch (e) {
    if (e.name === "AbortError") {
      return Response.json({ error: "Claude API timeout (25s)" }, { status: 504 });
    }
    return Response.json({ error: e.message || "Unknown error" }, { status: 500 });
  }
}

function lifePathNumber(d) {
  if (!d) return null;
  let s = d
    .replace(/-/g, "")
    .split("")
    .reduce((a, c) => a + parseInt(c), 0);
  while (s > 9 && s !== 11 && s !== 22 && s !== 33) {
    s = String(s)
      .split("")
      .reduce((a, c) => a + parseInt(c), 0);
  }
  return s;
}
