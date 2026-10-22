// /api/generate への入力を検証する。
// 画面の選択肢と同じ値だけを受け付け、自由入力（名前・禁止ワード）は長さを制限する。
// ここで弾いた値は Claude API に送られない（API 利用料の浪費と、指示の乗っ取りを防ぐため）。

const TONES = ["ですます調", "だよ体", "です体", "タメ口"];
const CHARACTERS = ["優しめ", "厳しめ", "中立", "ミステリアス"];
const THEMES = ["恋愛", "仕事", "人間関係", "スピリチュアル", "総合"];
const TOPICS = ["恋愛", "仕事", "人間関係", "健康", "お金", "自己成長"];
const CARDS = [
  "愚者", "魔術師", "女教皇", "女帝", "皇帝", "教皇", "恋人", "戦車", "力", "隠者",
  "運命の輪", "正義", "吊るされた男", "死神", "節制", "悪魔", "塔", "星", "月", "太陽", "審判", "世界",
];

const MAX_NAME = 40;
const MAX_BANNED = 100;
const MAX_BODY_BYTES = 4096;
const MAX_MESSAGE_CHARS = 600;

// 制御文字（改行・タブを含む）を落とす。自由入力が prompt の構造を崩さないように。
function clean(s) {
  return s.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
}

function pick(value, allowed) {
  return typeof value === "string" && allowed.includes(value) ? value : null;
}

function validBirth(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    y >= 1900 && y <= 2100 &&
    dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
  );
}

/** 成功時 { ok: true, value }、失敗時 { ok: false, error } */
function validateGenerateInput(body) {
  if (!body || typeof body !== "object") return { ok: false, error: "invalid body" };
  const { reader, client, card } = body;
  if (!reader || typeof reader !== "object" || !client || typeof client !== "object") {
    return { ok: false, error: "invalid body" };
  }

  const tone = pick(reader.tone, TONES);
  const character = pick(reader.character, CHARACTERS);
  const theme = pick(reader.theme, THEMES);
  const topic = pick(client.topic, TOPICS);
  const cardName = pick(card, CARDS);
  if (!tone || !character || !theme || !topic || !cardName) {
    return { ok: false, error: "invalid option" };
  }

  if (typeof client.name !== "string") return { ok: false, error: "invalid name" };
  const name = clean(client.name);
  if (!name || name.length > MAX_NAME) return { ok: false, error: "invalid name" };

  let banned = "";
  if (reader.banned !== undefined && reader.banned !== null && reader.banned !== "") {
    if (typeof reader.banned !== "string") return { ok: false, error: "invalid banned" };
    banned = clean(reader.banned);
    if (banned.length > MAX_BANNED) return { ok: false, error: "invalid banned" };
  }

  if (!validBirth(client.birth)) return { ok: false, error: "invalid birth" };

  return {
    ok: true,
    value: {
      reader: { tone, character, theme, banned },
      client: { name, birth: client.birth, topic },
      card: cardName,
    },
  };
}

/** LLM の出力を、画面に出してよい形（3 つの文字列）に絞る。駄目なら null */
function sanitizeMessages(obj) {
  if (!obj || typeof obj !== "object") return null;
  const out = {};
  for (const k of ["monday", "thursday", "sunday"]) {
    if (typeof obj[k] !== "string" || !obj[k].trim()) return null;
    out[k] = obj[k].slice(0, MAX_MESSAGE_CHARS);
  }
  return out;
}

module.exports = {
  validateGenerateInput,
  sanitizeMessages,
  MAX_NAME,
  MAX_BANNED,
  MAX_BODY_BYTES,
};
