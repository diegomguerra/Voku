// @ts-nocheck
"use client";
import { useState, useEffect } from "react";

const T = {
  sand:"#FAF8F3",white:"#FFFFFF",ink:"#111111",inkSub:"#3D3D3D",inkMid:"#6B6B6B",inkFaint:"#A0A0A0",
  lime:"#C8F135",border:"#E8E5DE",borderMd:"#D1CCBF",
  green:"#166534",greenBg:"#DCFCE7",teal:"#0D7A6E",tealBg:"#E6F5F3",
  amber:"#B45309",amberBg:"#FEF3C7",red:"#991B1B",redBg:"#FEE2E2",blue:"#1D4ED8",blueBg:"#DBEAFE",
};

const PLATFORM_COLORS: Record<string,{color:string;bg:string}> = {
  fiverr: { color: "#1DBF73", bg: "#E6F9F0" },
  workana: { color: "#0070C0", bg: "#E0F0FF" },
  upwork: { color: "#6FDA44", bg: "#EEFCE6" },
  direct: { color: T.ink, bg: "#F0F0F0" },
};

const TYPE_LABELS: Record<string,string> = {
  lead: "Lead",
  order_inquiry: "Consulta",
  client_message: "Cliente",
  notification: "Notificacao",
  spam: "Spam",
  unknown: "Outro",
};

const DIRECTION_LABELS: Record<string,{label:string;color:string;bg:string}> = {
  inbound: { label: "Recebida", color: T.teal, bg: T.tealBg },
  outbound: { label: "Enviada", color: T.blue, bg: T.blueBg },
};

function Card({children,style={}}:any){return <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:14,padding:"24px",boxShadow:"0 2px 8px rgba(0,0,0,0.04)",...style}}>{children}</div>}
function CardTitle({children}:any){return <div style={{fontSize:15,fontWeight:700,color:T.ink,marginBottom:20}}>{children}</div>}
function StatCard({label,value,sub,color}:any){return(<Card><div style={{fontSize:11,fontWeight:600,color:T.inkFaint,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>{label}</div><div style={{fontSize:34,fontWeight:800,color:color||T.ink,lineHeight:1,marginBottom:6}}>{value}</div>{sub&&<div style={{fontSize:13,color:T.inkMid}}>{sub}</div>}</Card>)}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm} ${hh}:${mi}`;
}

export default function InboxDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/inbox")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{background:T.sand,minHeight:"100vh",fontFamily:"'Plus Jakarta Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:18,fontWeight:600,color:T.inkMid}}>Carregando...</span>
      </div>
    );
  }

  const messages = data?.messages ?? [];
  const configs = data?.automation_configs ?? [];
  const filtered = filter === "all" ? messages : messages.filter((m:any) => m.platform === filter || m.message_type === filter || m.direction === filter);

  return (
    <div style={{background:T.sand,minHeight:"100vh",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      {/* Header */}
      <div style={{background:T.white,borderBottom:`1px solid ${T.border}`,padding:"0 40px",display:"flex",alignItems:"center",justifyContent:"space-between",height:64}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{background:T.ink,color:T.lime,fontFamily:"Georgia,serif",fontStyle:"italic",fontSize:20,padding:"4px 14px",borderRadius:6}}>Voku</div>
          <span style={{color:T.borderMd,fontSize:20}}>|</span>
          <span style={{fontSize:15,fontWeight:700,color:T.inkSub}}>Inbox RORDENS</span>
          <a href="/admin/dashboard" style={{fontSize:13,color:T.teal,fontWeight:600,textDecoration:"none",marginLeft:8}}>← Ops</a>
          <a href="/admin/dashboard/media" style={{fontSize:13,color:T.teal,fontWeight:600,textDecoration:"none",marginLeft:8}}>→ Midia</a>
        </div>
      </div>

      <div style={{padding:"32px 40px",maxWidth:1200,margin:"0 auto"}}>
        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:16,marginBottom:24}}>
          <StatCard label="Total Mensagens" value={String(data?.total ?? 0)} />
          <StatCard label="Leads" value={String(data?.leads ?? 0)} color={T.green} />
          <StatCard label="Recebidas" value={String(data?.inbound ?? 0)} color={T.teal} />
          <StatCard label="Respostas Enviadas" value={String(data?.replies_sent ?? 0)} color={T.blue} />
          <StatCard label="Sem Resposta" value={String(data?.unreplied ?? 0)} color={data?.unreplied > 0 ? T.red : T.ink} />
        </div>

        {/* Platform + Type breakdown */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}>
          <Card>
            <CardTitle>Por Plataforma</CardTitle>
            {(data?.platform_breakdown ?? []).map((p:any) => {
              const pc = PLATFORM_COLORS[p.platform] || { color: T.inkMid, bg: T.sand };
              return (
                <div key={p.platform} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{width:10,height:10,borderRadius:"50%",background:pc.color,flexShrink:0}} />
                    <span style={{fontSize:14,fontWeight:600,color:T.inkSub,textTransform:"capitalize"}}>{p.platform}</span>
                  </div>
                  <span style={{fontSize:16,fontWeight:800,color:T.ink}}>{p.count}</span>
                </div>
              );
            })}
            {(data?.platform_breakdown ?? []).length === 0 && <div style={{fontSize:13,color:T.inkFaint}}>Nenhuma mensagem ainda.</div>}
          </Card>
          <Card>
            <CardTitle>Por Tipo</CardTitle>
            {(data?.type_breakdown ?? []).map((t:any) => (
              <div key={t.type} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <span style={{fontSize:14,fontWeight:600,color:T.inkSub}}>{TYPE_LABELS[t.type] || t.type}</span>
                <span style={{fontSize:16,fontWeight:800,color:T.ink}}>{t.count}</span>
              </div>
            ))}
            {(data?.type_breakdown ?? []).length === 0 && <div style={{fontSize:13,color:T.inkFaint}}>Nenhuma mensagem ainda.</div>}
          </Card>
        </div>

        {/* Filters */}
        <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
          {[{key:"all",label:"Todas"},{key:"inbound",label:"Recebidas"},{key:"outbound",label:"Enviadas"},{key:"lead",label:"Leads"},{key:"fiverr",label:"Fiverr"},{key:"workana",label:"Workana"},{key:"upwork",label:"Upwork"},{key:"direct",label:"Direto"}].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              background: filter === f.key ? T.ink : T.white,
              color: filter === f.key ? T.lime : T.inkMid,
              border: `1px solid ${filter === f.key ? T.ink : T.border}`,
              borderRadius: 8, padding: "6px 16px", fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>{f.label}</button>
          ))}
        </div>

        {/* Messages list */}
        <Card style={{marginBottom:24}}>
          <CardTitle>Mensagens ({filtered.length})</CardTitle>
          {filtered.length === 0 ? (
            <div style={{textAlign:"center",padding:"40px 0"}}>
              <div style={{fontSize:28,marginBottom:12}}>&#x2709;</div>
              <div style={{fontSize:15,fontWeight:700,color:T.ink,marginBottom:6}}>Inbox vazia</div>
              <div style={{fontSize:13,color:T.inkMid}}>Nenhuma mensagem encontrada.</div>
            </div>
          ) : (
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr>
                  {["Plataforma","Direcao","Tipo","De","Assunto","Data","Resposta"].map(h => (
                    <th key={h} style={{textAlign:"left",fontSize:11,fontWeight:700,color:T.inkFaint,textTransform:"uppercase",letterSpacing:"0.06em",paddingBottom:12,borderBottom:`2px solid ${T.border}`}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m:any) => {
                  const pc = PLATFORM_COLORS[m.platform] || { color: T.inkMid, bg: T.sand };
                  const dir = DIRECTION_LABELS[m.direction] || { label: m.direction, color: T.inkMid, bg: T.sand };
                  return (
                    <tr key={m.id} onClick={() => setSelected(selected?.id === m.id ? null : m)} style={{cursor:"pointer",background: selected?.id === m.id ? T.sand : "transparent"}}>
                      <td style={{padding:"12px 8px 12px 0",fontSize:13,borderBottom:`1px solid ${T.border}`}}>
                        <span style={{fontSize:11,fontWeight:700,color:pc.color,background:pc.bg,borderRadius:20,padding:"3px 10px",textTransform:"capitalize"}}>{m.platform}</span>
                      </td>
                      <td style={{padding:"12px 8px",fontSize:13,borderBottom:`1px solid ${T.border}`}}>
                        <span style={{fontSize:11,fontWeight:700,color:dir.color,background:dir.bg,borderRadius:20,padding:"3px 10px"}}>{dir.label}</span>
                      </td>
                      <td style={{padding:"12px 8px",fontSize:12,color:T.inkSub,fontWeight:600,borderBottom:`1px solid ${T.border}`}}>{TYPE_LABELS[m.message_type] || m.message_type}</td>
                      <td style={{padding:"12px 8px",fontSize:13,color:T.inkSub,borderBottom:`1px solid ${T.border}`,maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.from_name || m.from_email || "—"}</td>
                      <td style={{padding:"12px 8px",fontSize:13,color:T.ink,fontWeight:600,borderBottom:`1px solid ${T.border}`,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.subject || "(sem assunto)"}</td>
                      <td style={{padding:"12px 8px",fontSize:12,color:T.inkMid,fontWeight:600,borderBottom:`1px solid ${T.border}`,whiteSpace:"nowrap"}}>{m.created_at ? formatDate(m.created_at) : "—"}</td>
                      <td style={{padding:"12px 0",fontSize:12,borderBottom:`1px solid ${T.border}`}}>
                        {m.reply_sent ? <span style={{color:T.green,fontWeight:700}}>Enviada</span> : m.direction === "inbound" ? <span style={{color:T.amber,fontWeight:700}}>Pendente</span> : <span style={{color:T.inkFaint}}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>

        {/* Selected message detail */}
        {selected && (
          <Card style={{marginBottom:24,borderLeft:`4px solid ${T.lime}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
              <div>
                <div style={{fontSize:17,fontWeight:700,color:T.ink,marginBottom:4}}>{selected.subject || "(sem assunto)"}</div>
                <div style={{fontSize:13,color:T.inkMid}}>De: {selected.from_name || "—"} &lt;{selected.from_email || "—"}&gt;</div>
                {selected.to_email && <div style={{fontSize:13,color:T.inkMid}}>Para: {selected.to_email}</div>}
              </div>
              <button onClick={() => setSelected(null)} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:6,padding:"4px 12px",fontSize:12,cursor:"pointer",color:T.inkMid,fontFamily:"inherit"}}>Fechar</button>
            </div>
            <div style={{background:T.sand,borderRadius:10,padding:"16px 20px",marginBottom:16,fontSize:14,color:T.inkSub,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{selected.body_clean || selected.body_raw || "(sem conteudo)"}</div>
            {selected.ai_classification && (
              <div style={{marginBottom:12}}>
                <div style={{fontSize:12,fontWeight:700,color:T.inkFaint,textTransform:"uppercase",marginBottom:6}}>Classificacao IA</div>
                <div style={{fontSize:13,color:T.inkSub,background:T.white,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 14px"}}>{typeof selected.ai_classification === "object" ? JSON.stringify(selected.ai_classification, null, 2) : String(selected.ai_classification)}</div>
              </div>
            )}
            {selected.ai_reply && (
              <div>
                <div style={{fontSize:12,fontWeight:700,color:T.inkFaint,textTransform:"uppercase",marginBottom:6}}>Resposta IA (RORDENS)</div>
                <div style={{fontSize:14,color:T.inkSub,background:T.tealBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"14px 18px",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{selected.ai_reply}</div>
              </div>
            )}
          </Card>
        )}

        {/* Automation configs */}
        <Card>
          <CardTitle>Configuracao de Automacao</CardTitle>
          {configs.length === 0 ? (
            <div style={{fontSize:13,color:T.inkFaint}}>Nenhuma configuracao encontrada.</div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(configs.length, 4)},1fr)`,gap:14}}>
              {configs.map((c:any) => {
                const pc = PLATFORM_COLORS[c.platform] || { color: T.inkMid, bg: T.sand };
                return (
                  <div key={c.id} style={{border:`1px solid ${T.border}`,borderRadius:12,padding:"18px 20px",background:T.sand}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                      <span style={{width:8,height:8,borderRadius:"50%",background:pc.color}} />
                      <span style={{fontSize:14,fontWeight:700,color:T.ink,textTransform:"capitalize"}}>{c.platform}</span>
                    </div>
                    <div style={{fontSize:12,color:T.inkMid,marginBottom:6}}>E-mail: <span style={{fontWeight:600,color:T.inkSub}}>{c.inbox_email}</span></div>
                    <div style={{fontSize:12,color:T.inkMid,marginBottom:6}}>Auto-reply: <span style={{fontWeight:700,color:c.auto_reply_enabled ? T.green : T.red}}>{c.auto_reply_enabled ? "Ativo" : "Inativo"}</span></div>
                    <div style={{fontSize:12,color:T.inkMid,marginBottom:6}}>Delay: <span style={{fontWeight:600,color:T.inkSub}}>{c.reply_delay_minutes}min</span></div>
                    <div style={{fontSize:12,color:T.inkMid,marginBottom:6}}>Tom: <span style={{fontWeight:600,color:T.inkSub}}>{c.tone}</span></div>
                    <div style={{fontSize:12,color:T.inkMid}}>Idioma: <span style={{fontWeight:600,color:T.inkSub}}>{c.language}</span></div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
