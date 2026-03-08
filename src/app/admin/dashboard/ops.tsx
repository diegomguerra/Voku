// @ts-nocheck
"use client";
import { useState, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
const T = {
  sand:"#FAF8F3",white:"#FFFFFF",ink:"#111111",inkSub:"#3D3D3D",inkMid:"#6B6B6B",inkFaint:"#A0A0A0",
  lime:"#C8F135",border:"#E8E5DE",borderMd:"#D1CCBF",
  green:"#166534",greenBg:"#DCFCE7",teal:"#0D7A6E",tealBg:"#E6F5F3",
  amber:"#B45309",amberBg:"#FEF3C7",red:"#991B1B",blue:"#1D4ED8",
};
const PRODUCT_LABELS: Record<string,string> = {
  landing_page_copy: "Landing Page",
  content_pack: "Content Pack",
  email_sequence: "E-mail Seq.",
};
const PIE_COLORS = ["#111111","#0D7A6E","#1D4ED8","#B45309","#991B1B"];
const STATUS:Record<string,{color:string;bg:string}>={"entregue":{color:"#166534",bg:"#DCFCE7"},"em produção":{color:"#0D7A6E",bg:"#E6F5F3"},"briefing":{color:"#B45309",bg:"#FEF3C7"}};
function Card({children,style={}}:any){return <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:14,padding:"24px",boxShadow:"0 2px 8px rgba(0,0,0,0.04)",...style}}>{children}</div>}
function CardTitle({children}:any){return <div style={{fontSize:15,fontWeight:700,color:T.ink,marginBottom:20}}>{children}</div>}
function StatCard({label,value,sub,delta}:any){return(<Card><div style={{fontSize:11,fontWeight:600,color:T.inkFaint,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>{label}</div><div style={{fontSize:34,fontWeight:800,color:T.ink,lineHeight:1,marginBottom:6}}>{value}</div>{sub&&<div style={{fontSize:13,color:T.inkMid}}>{sub}</div>}{delta!==undefined&&<div style={{fontSize:12,fontWeight:600,color:delta>0?T.green:T.red,marginTop:8}}>{delta>0?"↑":"↓"} {Math.abs(delta)}% vs mês anterior</div>}</Card>)}
function TT({active,payload,label}:any){if(!active||!payload?.length)return null;return(<div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 14px",fontSize:13,boxShadow:"0 4px 16px rgba(0,0,0,0.1)"}}><div style={{color:T.inkMid,marginBottom:4,fontWeight:600}}>{label}</div>{payload.map((p:any,i:number)=><div key={i} style={{color:T.ink,fontWeight:700}}>{p.name==="usd"?"USD $":"BRL R$"}{p.value.toLocaleString()}</div>)}</div>)}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function OpsDashboard(){
  const [currency,setCurrency]=useState<"usd"|"brl">("usd");
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    fetch("/api/admin/ops")
      .then(r=>r.json())
      .then(d=>{setData(d);setLoading(false);})
      .catch(()=>setLoading(false));
  },[]);

  if(loading){
    return(
      <div style={{background:T.sand,minHeight:"100vh",fontFamily:"'Plus Jakarta Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:18,fontWeight:600,color:T.inkMid}}>Carregando...</span>
      </div>
    );
  }

  const totalOrders = data?.total_orders ?? 0;
  const activeOrders = data?.active_orders ?? 0;
  const deliveredOrders = data?.delivered_orders ?? 0;
  const revenueUsd = data?.revenue_usd ?? 0;
  const revenueBrl = data?.revenue_brl ?? 0;
  const avgDeliveryHours = data?.avg_delivery_hours ?? 0;
  const productMix = (data?.product_mix ?? []).map((p: any, i: number) => ({
    name: PRODUCT_LABELS[p.product] || p.product,
    value: p.count,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));
  const recentOrders = (data?.recent_orders ?? []).map((o: any) => ({
    id: `#${o.order_number}`,
    product: PRODUCT_LABELS[o.product] || o.product,
    status: o.status,
    value: o.currency === "brl" ? `R$${o.amount}` : `$${o.amount}`,
    date: o.created_at ? formatDate(o.created_at) : "—",
    deadline: o.delivery_deadline ? formatDate(o.delivery_deadline) : "—",
  }));
  const monthlyRevenue = (data?.monthly_revenue ?? []).map((m: any) => ({
    month: m.month,
    usd: m.usd,
    brl: m.brl,
  }));
  const ticketAvgUsd = totalOrders > 0 ? Math.round(revenueUsd / totalOrders) : 0;
  const ticketAvgBrl = totalOrders > 0 ? Math.round(revenueBrl / totalOrders) : 0;

  return(<div style={{background:T.sand,minHeight:"100vh",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
    <div style={{background:T.white,borderBottom:`1px solid ${T.border}`,padding:"0 40px",display:"flex",alignItems:"center",justifyContent:"space-between",height:64}}>
      <div style={{display:"flex",alignItems:"center",gap:16}}>
        <div style={{background:T.ink,color:T.lime,fontFamily:"Georgia,serif",fontStyle:"italic",fontSize:20,padding:"4px 14px",borderRadius:6}}>Voku</div>
        <span style={{color:T.borderMd,fontSize:20}}>|</span>
        <span style={{fontSize:15,fontWeight:700,color:T.inkSub}}>Dashboard Operacional</span>
        <a href="/admin/dashboard/media" style={{fontSize:13,color:T.teal,fontWeight:600,textDecoration:"none",marginLeft:8}}>→ Mídia</a>
      </div>
      <div style={{display:"flex",gap:4,background:T.sand,border:`1px solid ${T.border}`,borderRadius:8,padding:4}}>
        {(["usd","brl"] as const).map(c=><button key={c} onClick={()=>setCurrency(c)} style={{background:currency===c?T.ink:"transparent",color:currency===c?T.lime:T.inkMid,border:"none",borderRadius:6,padding:"6px 18px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{c.toUpperCase()}</button>)}
      </div>
    </div>
    <div style={{padding:"32px 40px",maxWidth:1200,margin:"0 auto"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
        <StatCard label="Receita Total" value={currency==="usd"?`$${revenueUsd.toLocaleString()}`:`R$${revenueBrl.toLocaleString()}`} sub={`${deliveredOrders} entregues`}/>
        <StatCard label="Pedidos" value={String(totalOrders)} sub={`${activeOrders} ativos`}/>
        <StatCard label="Ticket Médio" value={currency==="usd"?`$${ticketAvgUsd}`:`R$${ticketAvgBrl}`}/>
        <StatCard label="Tempo de Entrega" value={`${avgDeliveryHours}h`} sub="média atual"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16,marginBottom:24}}>
        <Card>
          <CardTitle>Receita mensal ({currency.toUpperCase()})</CardTitle>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyRevenue}>
              <XAxis dataKey="month" tick={{fontSize:13,fill:T.inkMid}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:12,fill:T.inkMid}} axisLine={false} tickLine={false}/>
              <Tooltip content={<TT/>}/>
              <Line type="monotone" dataKey={currency} stroke={T.ink} strokeWidth={3} dot={{fill:T.lime,strokeWidth:0,r:5}}/>
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <CardTitle>Mix de produtos</CardTitle>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart><Pie data={productMix} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
              {productMix.map((e:any,i:number)=><Cell key={i} fill={e.color}/>)}
            </Pie><Tooltip formatter={(v:any)=>[`${v} pedidos`]} contentStyle={{background:T.white,border:`1px solid ${T.border}`,borderRadius:8,fontSize:13}}/></PieChart>
          </ResponsiveContainer>
          {productMix.map((p:any,i:number)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <span style={{width:10,height:10,borderRadius:"50%",background:p.color,flexShrink:0}}/>
            <span style={{fontSize:13,color:T.inkSub}}>{p.name}</span>
            <span style={{fontSize:13,fontWeight:800,color:T.ink,marginLeft:"auto"}}>{p.value}</span>
          </div>))}
        </Card>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr",gap:16}}>
        <Card>
          <CardTitle>Pedidos recentes</CardTitle>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>{["ID","Produto","Status","Valor","Data","Prazo"].map(h=><th key={h} style={{textAlign:"left",fontSize:11,fontWeight:700,color:T.inkFaint,textTransform:"uppercase",letterSpacing:"0.06em",paddingBottom:12,borderBottom:`2px solid ${T.border}`}}>{h}</th>)}</tr></thead>
            <tbody>{recentOrders.map((o:any,i:number)=>{const st=STATUS[o.status]||{color:T.inkMid,bg:T.sand};return(<tr key={i}>
              <td style={{padding:"13px 0",fontSize:13,color:T.inkMid,fontWeight:600,borderBottom:`1px solid ${T.border}`}}>{o.id}</td>
              <td style={{padding:"13px 8px",fontSize:13,color:T.inkSub,borderBottom:`1px solid ${T.border}`}}>{o.product}</td>
              <td style={{padding:"13px 8px",borderBottom:`1px solid ${T.border}`}}><span style={{fontSize:11,fontWeight:700,color:st.color,background:st.bg,borderRadius:20,padding:"4px 12px"}}>{o.status}</span></td>
              <td style={{padding:"13px 8px",fontSize:14,fontWeight:800,color:T.ink,borderBottom:`1px solid ${T.border}`}}>{o.value}</td>
              <td style={{padding:"13px 8px",fontSize:13,color:T.inkMid,fontWeight:600,borderBottom:`1px solid ${T.border}`}}>{o.date}</td>
              <td style={{padding:"13px 0",fontSize:13,color:T.inkMid,fontWeight:600,borderBottom:`1px solid ${T.border}`}}>{o.deadline}</td>
            </tr>)})}</tbody>
          </table>
        </Card>
      </div>
    </div>
  </div>)}
