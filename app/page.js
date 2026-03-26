"use client";
import { useState, useCallback, useRef, useEffect } from "react";

/* ═══════════════════════════════════════════
   TAROT COACHING 継続サービス
   Vercel deploy version
   ═══════════════════════════════════════════ */

const MAJOR_ARCANA = [
  "愚者","魔術師","女教皇","女帝","皇帝","教皇","恋人","戦車","力","隠者",
  "運命の輪","正義","吊るされた男","死神","節制","悪魔","塔","星","月","太陽","審判","世界"
];
const ARCANA_EMOJI = {
  "愚者":"🃏","魔術師":"🪄","女教皇":"📿","女帝":"👑","皇帝":"🏛","教皇":"⛪",
  "恋人":"💕","戦車":"🏇","力":"🦁","隠者":"🏮","運命の輪":"🎡","正義":"⚖️",
  "吊るされた男":"🔮","死神":"🦋","節制":"🌊","悪魔":"🔗","塔":"⚡","星":"⭐",
  "月":"🌙","太陽":"☀️","審判":"🔔","世界":"🌍"
};
const CARD_MEANING = {
  "愚者":"新たな始まり・自由・未知への一歩","魔術師":"才能の発揮・創造力・意志の力",
  "女教皇":"直感・内なる知恵・静かな洞察","女帝":"豊かさ・育む力・母性",
  "皇帝":"安定・統率力・秩序の構築","教皇":"導き・学び・精神的な成長",
  "恋人":"選択・パートナーシップ・価値観","戦車":"前進・勝利・自己制御",
  "力":"内なる強さ・忍耐・柔らかな勇気","隠者":"内省・探求・一人の時間の価値",
  "運命の輪":"転換期・サイクル・運の変化","正義":"公正・バランス・因果",
  "吊るされた男":"視点の転換・手放し・受容","死神":"終わりと再生・変容・決別",
  "節制":"調和・バランス・穏やかな統合","悪魔":"執着・束縛からの解放",
  "塔":"突然の変化・崩壊と再構築・覚醒","星":"希望・インスピレーション・癒し",
  "月":"不安・幻想・無意識のメッセージ","太陽":"成功・喜び・活力",
  "審判":"復活・目覚め・人生の使命","世界":"完成・達成・新たなサイクル"
};

function pickCard(name, birth) {
  const w = Math.floor(Date.now() / (7*24*60*60*1000));
  let h = w;
  for (let i=0;i<(name||"").length;i++) h += name.charCodeAt(i);
  for (let i=0;i<(birth||"").length;i++) h += birth.charCodeAt(i)*(i+1);
  return MAJOR_ARCANA[Math.abs(h) % MAJOR_ARCANA.length];
}

function lifePathNumber(d) {
  if (!d) return null;
  let s = d.replace(/-/g,"").split("").reduce((a,c)=>a+parseInt(c),0);
  while (s>9 && s!==11 && s!==22 && s!==33)
    s = String(s).split("").reduce((a,c)=>a+parseInt(c),0);
  return s;
}

// ── Local fallback ──
function localGenerate(reader, client, card) {
  const meaning = CARD_MEANING[card] || "深い意味を持つカード";
  const lpn = lifePathNumber(client.birth);
  const toneMap = {
    "ですます調":{end:"ですね",q:"でしょうか？",yo:"ですよ"},
    "だよ体":{end:"だよね",q:"かな？",yo:"だよ"},
    "です体":{end:"ですね",q:"ですか？",yo:"ですよ"},
    "タメ口":{end:"だよね",q:"かな？",yo:"だよ"},
  };
  const t = toneMap[reader.tone] || toneMap["ですます調"];
  const charPrefix = {
    "優しめ":`${client.name}さん、こんにちは。\n`,
    "厳しめ":`${client.name}さん。\n`,
    "中立":`${client.name}さん、おはようございます。\n`,
    "ミステリアス":`${client.name}さん…。\n`,
  };
  const prefix = charPrefix[reader.character] || `${client.name}さん、\n`;
  const topicCtx = {
    "恋愛":"大切な人との関係","仕事":"今のお仕事や将来のキャリア",
    "人間関係":"周りの人との繋がり","健康":"心と体のバランス",
    "お金":"お金や豊かさの流れ","自己成長":"自分自身の成長",
  };
  const ctx = topicCtx[client.topic] || "今の状況";

  return {
    monday: `${prefix}今週あなたに届いたカードは「${card}」。\n${meaning}を示すこのカード、${ctx}において今一番気になっていることは何${t.q}\nライフパスナンバー${lpn}のあなたには、今週特に「自分の本音に耳を傾ける」ことが鍵になりそう${t.end}`,
    thursday: `${client.name}さん、月曜の問いかけ、考えてみましたか？\n答えがすぐに出なくても大丈夫${t.yo}。「${card}」のエネルギーは週の半ばに深まります。ふと浮かんだ気づきを大切にしてください。`,
    sunday: `${client.name}さん、今週はどんな一週間でしたか？\n「${card}」と過ごした日々を振り返って、一言だけ教えてください。あなたの声が、来週のカードに反映されます${t.yo}。`,
  };
}

// ── API call via Route Handler ──
async function generateMessages(reader, client, card) {
  try {
    const resp = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reader, client, card }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || `Server error ${resp.status}`);
    }
    const data = await resp.json();
    return { ...data.messages, source: data.source || "ai" };
  } catch (e) {
    console.warn("API failed, using local fallback:", e.message);
    return { ...localGenerate(reader, client, card), source: "local" };
  }
}

// ── Colors ──
const C = {
  bg:"#faf8f5", card:"#ffffff", cardAlt:"#f5f0eb",
  accent:"#b07aa8", accentLight:"#ece0ea", accentText:"#7d4e76",
  warm:"#c4926e", warmLight:"#f3e8df", warmText:"#8b5e42",
  text:"#3a3334", textMid:"#6b5f60", textDim:"#9a8e8f",
  border:"#e5ddd8", borderLight:"#efe8e3",
  input:"#ffffff", inputBorder:"#ddd4ce",
  err:"#c5463a", ok:"#5a9a6e",
  monday:"#b07aa8", thursday:"#6a8fba", sunday:"#c4926e",
};
const serif = "'Shippori Mincho B1','Noto Serif JP',Georgia,serif";
const sans = "'Zen Kaku Gothic New','Noto Sans JP',sans-serif";

// ── UI Primitives ──
const Spacer=({h=16})=><div style={{height:h}}/>;

function Btn({children,onClick,disabled,secondary,color,style:sx}){
  const [hov,setHov]=useState(false);
  const c=color||C.accent;
  return <button style={{
    fontFamily:sans,fontSize:14,fontWeight:700,borderRadius:10,
    cursor:disabled?"default":"pointer",padding:"13px 28px",
    background:disabled?"#e5ddd8":secondary?"transparent":(hov?`${c}dd`:c),
    color:disabled?C.textDim:secondary?c:"#ffffff",
    border:secondary?`1.5px solid ${disabled?"#e5ddd8":c}`:"1.5px solid transparent",
    opacity:disabled?0.5:1,transition:"all 0.2s",letterSpacing:0.5,...sx,
  }} onClick={onClick} disabled={disabled}
    onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>{children}</button>;
}

function Field({label,children,required}){
  return <div style={{marginBottom:20}}>
    <label style={{display:"block",fontFamily:sans,fontSize:12,fontWeight:700,
      color:C.textMid,marginBottom:6,letterSpacing:0.5}}>
      {label}{required&&<span style={{color:C.accent}}> *</span>}
    </label>{children}
  </div>;
}

function Input({value,onChange,placeholder}){
  return <input value={value} onChange={e=>onChange(e.target.value)}
    placeholder={placeholder} style={{width:"100%",padding:"11px 14px",fontFamily:sans,
      fontSize:15,background:C.input,color:C.text,border:`1.5px solid ${C.inputBorder}`,
      borderRadius:10,outline:"none",boxSizing:"border-box",transition:"border-color 0.2s"}}
    onFocus={e=>e.target.style.borderColor=C.accent}
    onBlur={e=>e.target.style.borderColor=C.inputBorder}/>;
}

const ddBase={fontFamily:sans,fontSize:15,background:C.input,color:C.text,
  border:`1.5px solid ${C.inputBorder}`,borderRadius:10,padding:"11px 8px",
  outline:"none",appearance:"auto",flex:1,minWidth:0};

function BirthSelect({year,month,day,onYear,onMonth,onDay}){
  const years=[];for(let y=2010;y>=1930;y--)years.push(y);
  const months=[];for(let m=1;m<=12;m++)months.push(m);
  const maxD=year&&month?new Date(year,month,0).getDate():31;
  const days=[];for(let d=1;d<=maxD;d++)days.push(d);
  return <div style={{display:"flex",gap:8}}>
    <select value={year} onChange={e=>onYear(e.target.value)} style={ddBase}>
      <option value="">年</option>
      {years.map(y=><option key={y} value={y}>{y}年</option>)}
    </select>
    <select value={month} onChange={e=>onMonth(e.target.value)} style={ddBase}>
      <option value="">月</option>
      {months.map(m=><option key={m} value={m}>{m}月</option>)}
    </select>
    <select value={day} onChange={e=>onDay(e.target.value)} style={ddBase}>
      <option value="">日</option>
      {days.map(d=><option key={d} value={d}>{d}日</option>)}
    </select>
  </div>;
}

function Chips({options,value,onChange}){
  return <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
    {options.map(o=>{
      const v=o.v||o,l=o.l||o,sel=value===v;
      return <button key={v} onClick={()=>onChange(v)} style={{
        fontFamily:sans,fontSize:14,fontWeight:sel?700:500,padding:"8px 18px",
        borderRadius:20,border:`1.5px solid ${sel?C.accent:C.border}`,
        background:sel?C.accentLight:"transparent",color:sel?C.accentText:C.textMid,
        cursor:"pointer",transition:"all 0.2s"}}>{l}</button>;
    })}
  </div>;
}

function CardPanel({sx,children}){
  return <div style={{background:C.card,borderRadius:16,
    border:`1px solid ${C.border}`,padding:28,
    boxShadow:"0 2px 12px rgba(0,0,0,0.04)",...sx}}>{children}</div>;
}

function MsgBubble({day,text,visible}){
  if(!visible) return null;
  const cfg={
    mon:{label:"月曜 – カード＋問いかけ",color:C.monday,bg:"#f5ecf4",icon:"🌅"},
    thu:{label:"木曜 – フォロー",color:C.thursday,bg:"#ecf1f7",icon:"💬"},
    sun:{label:"日曜 – 振り返り促し",color:C.sunday,bg:"#f7f0e8",icon:"🌇"},
  };
  const d=cfg[day];
  return <div style={{animation:"fadeSlideUp 0.5s ease-out both",marginBottom:20}}>
    <div style={{fontFamily:sans,fontSize:12,fontWeight:700,color:d.color,
      marginBottom:8,letterSpacing:0.5}}>{d.icon} {d.label}</div>
    <div style={{background:d.bg,borderRadius:"4px 18px 18px 18px",
      border:`1px solid ${C.borderLight}`,padding:"18px 22px",
      fontFamily:serif,fontSize:16,lineHeight:2.0,color:C.text,
      whiteSpace:"pre-wrap"}}>{text}</div>
  </div>;
}

// ═══════ MAIN ═══════
export default function Home(){
  const [mode,setMode]=useState("reader");
  const [tone,setTone]=useState("ですます調");
  const [character,setCharacter]=useState("優しめ");
  const [theme,setTheme]=useState("恋愛");
  const [banned,setBanned]=useState("");
  const [readerSaved,setReaderSaved]=useState(false);

  const [clients,setClients]=useState([]);
  const [newName,setNewName]=useState("");
  const [nY,setNY]=useState("");const [nM,setNM]=useState("");const [nD,setND]=useState("");
  const [newTopic,setNewTopic]=useState("");
  const newBirth=(nY&&nM&&nD)?`${nY}-${String(nM).padStart(2,"0")}-${String(nD).padStart(2,"0")}`:"";

  const [activeClient,setActiveClient]=useState(null);
  const [messages,setMessages]=useState(null);
  const [msgSource,setMsgSource]=useState("");
  const [card,setCard]=useState("");
  const [reveal,setReveal]=useState(0);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [elapsed,setElapsed]=useState(0);
  const timerRef=useRef(null);

  useEffect(()=>{
    if(loading){setElapsed(0);timerRef.current=setInterval(()=>setElapsed(p=>p+1),1000);}
    else clearInterval(timerRef.current);
    return()=>clearInterval(timerRef.current);
  },[loading]);

  const addClient=()=>{
    if(!newName.trim()||!newBirth||!newTopic)return;
    setClients(p=>[...p,{id:Date.now(),name:newName.trim(),birth:newBirth,topic:newTopic}]);
    setNewName("");setNY("");setNM("");setND("");setNewTopic("");
  };

  const startClientExp=(cl)=>{
    setActiveClient(cl);setMessages(null);setReveal(0);setError("");setMsgSource("");setMode("client");
  };

  const doGenerate=useCallback(async()=>{
    if(!activeClient)return;
    setLoading(true);setMessages(null);setReveal(0);setError("");setMsgSource("");
    const c=pickCard(activeClient.name,activeClient.birth);
    setCard(c);
    const result=await generateMessages(
      {tone,character,theme,banned},
      {name:activeClient.name,birth:activeClient.birth,topic:activeClient.topic},c);
    setMsgSource(result.source);
    setMessages({monday:result.monday,thursday:result.thursday,sunday:result.sunday});
    setReveal(1);setLoading(false);
  },[tone,character,theme,banned,activeClient]);

  const readerReady=tone&&character&&theme;

  return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:sans,padding:"0 16px 60px"}}>

      {/* Header */}
      <div style={{textAlign:"center",paddingTop:32,marginBottom:4}}>
        <div style={{fontSize:24,letterSpacing:2,fontFamily:serif,fontWeight:700,color:C.accentText}}>
          🔮 タロットコーチング</div>
        <div style={{fontSize:11,color:C.textDim,marginTop:4,letterSpacing:1}}>
          継続サービス デモ</div>
      </div>

      {/* Tab */}
      <div style={{display:"flex",justifyContent:"center",gap:6,margin:"16px 0 24px"}}>
        {[{key:"reader",label:"🔧 占い師側",color:C.accentText,bg:C.accentLight},
          {key:"client",label:"📱 お客さん側",color:C.warmText,bg:C.warmLight}
        ].map(t=>{
          const a=mode===t.key;
          return <button key={t.key} onClick={()=>setMode(t.key)} style={{
            fontFamily:sans,fontSize:13,fontWeight:a?700:500,padding:"10px 24px",
            borderRadius:10,cursor:"pointer",background:a?t.bg:"transparent",
            color:a?t.color:C.textDim,border:`1.5px solid ${a?t.color+"44":C.border}`,
            transition:"all 0.2s",letterSpacing:0.5}}>{t.label}</button>;
        })}
      </div>

      <div style={{maxWidth:540,margin:"0 auto"}}>

        {/* ═══ READER MODE ═══ */}
        {mode==="reader"&&(
          <div style={{animation:"fadeSlideUp 0.3s ease-out"}}>
            <CardPanel sx={{marginBottom:20}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                <div style={{fontFamily:serif,fontSize:18,fontWeight:700,color:C.accentText}}>
                  プロフィール設定</div>
                {readerSaved&&<span style={{fontFamily:sans,fontSize:12,color:C.ok,fontWeight:600}}>✓ 保存済み</span>}
              </div>
              <Field label="口調" required>
                <Chips value={tone} onChange={v=>{setTone(v);setReaderSaved(false);}}
                  options={["ですます調","だよ体","です体","タメ口"]}/></Field>
              <Field label="キャラクター" required>
                <Chips value={character} onChange={v=>{setCharacter(v);setReaderSaved(false);}}
                  options={["優しめ","厳しめ","中立","ミステリアス"]}/></Field>
              <Field label="得意テーマ" required>
                <Chips value={theme} onChange={v=>{setTheme(v);setReaderSaved(false);}}
                  options={["恋愛","仕事","人間関係","スピリチュアル","総合"]}/></Field>
              <Field label="禁止ワード（カンマ区切り）">
                <Input value={banned} onChange={v=>{setBanned(v);setReaderSaved(false);}}
                  placeholder="例: 別れ, 不幸, 災い"/></Field>
              <div style={{textAlign:"right"}}>
                <Btn disabled={!readerReady} color={C.accent}
                  onClick={()=>setReaderSaved(true)}>設定を保存</Btn>
              </div>
            </CardPanel>

            <CardPanel>
              <div style={{fontFamily:serif,fontSize:18,fontWeight:700,color:C.accentText,marginBottom:18}}>
                顧客管理</div>
              <div style={{background:C.cardAlt,borderRadius:14,padding:18,marginBottom:18,
                border:`1px solid ${C.borderLight}`}}>
                <div style={{fontFamily:sans,fontSize:12,fontWeight:700,color:C.textMid,
                  marginBottom:12,letterSpacing:0.5}}>新しいお客さんを追加</div>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <Input value={newName} onChange={setNewName} placeholder="お名前"/>
                  <BirthSelect year={nY} month={nM} day={nD}
                    onYear={setNY} onMonth={setNM} onDay={setND}/>
                  <Chips value={newTopic} onChange={setNewTopic} options={[
                    {v:"恋愛",l:"💕 恋愛"},{v:"仕事",l:"💼 仕事"},
                    {v:"人間関係",l:"🤝 人間関係"},{v:"健康",l:"🌿 健康"},
                    {v:"お金",l:"💰 お金"},{v:"自己成長",l:"🌱 自己成長"},
                  ]}/>
                  <div style={{textAlign:"right"}}>
                    <Btn disabled={!newName.trim()||!newBirth||!newTopic}
                      onClick={addClient} color={C.accent}
                      style={{padding:"10px 22px",fontSize:13}}>追加</Btn>
                  </div>
                </div>
              </div>

              {clients.length===0?(
                <div style={{fontFamily:sans,fontSize:14,color:C.textDim,textAlign:"center",padding:"24px 0"}}>
                  まだお客さんが登録されていません</div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {clients.map(cl=>(
                    <div key={cl.id} style={{display:"flex",alignItems:"center",gap:10,
                      background:C.cardAlt,borderRadius:12,padding:"14px 18px",
                      border:`1px solid ${C.borderLight}`}}>
                      <div style={{flex:1}}>
                        <div style={{fontFamily:sans,fontSize:15,fontWeight:600,color:C.text}}>
                          {cl.name}</div>
                        <div style={{fontFamily:sans,fontSize:12,color:C.textDim,marginTop:3}}>
                          {cl.birth} ｜ {cl.topic} ｜ LP{lifePathNumber(cl.birth)}</div>
                      </div>
                      <Btn secondary color={C.warm} style={{padding:"8px 16px",fontSize:13}}
                        onClick={()=>startClientExp(cl)}>体験→</Btn>
                      <button onClick={()=>setClients(p=>p.filter(x=>x.id!==cl.id))} style={{
                        background:"none",border:"none",color:C.textDim,cursor:"pointer",
                        fontSize:18,padding:"4px 8px",lineHeight:1}}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </CardPanel>
          </div>
        )}

        {/* ═══ CLIENT MODE ═══ */}
        {mode==="client"&&(
          <div style={{animation:"fadeSlideUp 0.3s ease-out"}}>
            {!activeClient?(
              <CardPanel sx={{textAlign:"center",padding:"44px 28px"}}>
                <div style={{fontSize:40,marginBottom:12}}>📱</div>
                <div style={{fontFamily:serif,fontSize:17,color:C.text,marginBottom:8}}>
                  お客さんが選択されていません</div>
                <div style={{fontFamily:sans,fontSize:14,color:C.textDim,lineHeight:1.8,marginBottom:24}}>
                  「占い師側」でお客さんを追加し<br/>「体験→」で切り替わります</div>
                <Btn secondary color={C.accent} onClick={()=>setMode("reader")}>占い師側へ</Btn>
              </CardPanel>
            ):(
              <>
                <div style={{background:C.warmLight,borderRadius:14,padding:"16px 22px",
                  border:`1px solid ${C.borderLight}`,marginBottom:20,
                  display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontFamily:sans,fontSize:16,fontWeight:600,color:C.text}}>
                      {activeClient.name}さん</div>
                    <div style={{fontFamily:sans,fontSize:12,color:C.textMid,marginTop:3}}>
                      テーマ: {activeClient.topic} ｜ LP{lifePathNumber(activeClient.birth)}</div>
                  </div>
                  {!loading&&!messages&&(
                    <Btn color={C.accent} style={{padding:"10px 20px",fontSize:14}}
                      onClick={doGenerate}>カードを引く 🃏</Btn>
                  )}
                </div>

                {loading&&(
                  <div style={{textAlign:"center",padding:"52px 0"}}>
                    <div style={{fontSize:48,marginBottom:16,animation:"gentleSpin 3s linear infinite"}}>🔮</div>
                    <div style={{fontFamily:serif,fontSize:18,color:C.accentText,marginBottom:8}}>
                      カードを引いています...</div>
                    <div style={{fontFamily:sans,fontSize:13,color:C.textDim}}>{elapsed}秒</div>
                  </div>
                )}

                {error&&!loading&&(
                  <CardPanel sx={{textAlign:"center",padding:"32px 28px",marginBottom:16}}>
                    <div style={{fontSize:28,marginBottom:8}}>⚠️</div>
                    <div style={{fontFamily:sans,fontSize:14,color:C.err,marginBottom:16,lineHeight:1.6}}>
                      {error}</div>
                    <Btn onClick={doGenerate} color={C.accent}>もう一度試す</Btn>
                  </CardPanel>
                )}

                {messages&&(
                  <>
                    <CardPanel sx={{textAlign:"center",marginBottom:24,
                      background:`linear-gradient(135deg,${C.accentLight},${C.warmLight})`}}>
                      <div style={{fontSize:52,marginBottom:10}}>{ARCANA_EMOJI[card]||"🃏"}</div>
                      <div style={{fontFamily:serif,fontSize:24,fontWeight:700,color:C.accentText}}>
                        {card}</div>
                      <div style={{fontFamily:sans,fontSize:13,color:C.textMid,marginTop:8}}>
                        {activeClient.name}さんの今週のカード</div>
                      {msgSource==="local"&&(
                        <div style={{fontFamily:sans,fontSize:11,color:C.textDim,marginTop:10,
                          padding:"4px 14px",background:"rgba(255,255,255,0.6)",borderRadius:8,
                          display:"inline-block"}}>
                          ※ テンプレート生成（API応答待ち超過）</div>
                      )}
                    </CardPanel>

                    <MsgBubble day="mon" text={messages.monday} visible={reveal>=1}/>
                    {reveal===1&&<div style={{textAlign:"center",margin:"18px 0"}}>
                      <Btn onClick={()=>setReveal(2)} secondary color={C.thursday}>
                        木曜のメッセージを見る →</Btn></div>}

                    <MsgBubble day="thu" text={messages.thursday} visible={reveal>=2}/>
                    {reveal===2&&<div style={{textAlign:"center",margin:"18px 0"}}>
                      <Btn onClick={()=>setReveal(3)} secondary color={C.sunday}>
                        日曜のメッセージを見る →</Btn></div>}

                    <MsgBubble day="sun" text={messages.sunday} visible={reveal>=3}/>

                    {reveal===3&&(
                      <div style={{marginTop:28}}>
                        <CardPanel sx={{background:C.cardAlt}}>
                          <div style={{fontFamily:sans,fontSize:14,color:C.textMid,lineHeight:1.9}}>
                            ✅ 週3回の配信（月・木・日）プレビュー完了<br/>
                            実運用ではLINE経由で自動配信されます。</div>
                        </CardPanel>
                        <Spacer h={18}/>
                        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
                          <Btn secondary color={C.accent} onClick={()=>{
                            setMessages(null);setReveal(0);setMsgSource("");setError("");}}>
                            もう一度引く</Btn>
                          <Btn secondary color={C.warm} onClick={()=>{
                            setMessages(null);setReveal(0);setActiveClient(null);setError("");setMode("reader");}}>
                            占い師側に戻る</Btn>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div style={{textAlign:"center",marginTop:52,fontFamily:sans,fontSize:11,color:C.textDim,letterSpacing:0.5}}>
        タロットコーチング継続サービス ｜ ビジネスリノベーション × Claude</div>
    </div>
  );
}
