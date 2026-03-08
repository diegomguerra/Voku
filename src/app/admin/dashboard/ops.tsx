"use client";
import { useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
const T = {
  sand:"#FAF8F3",white:"#FFFFFF",ink:"#111111",inkSub:"#3D3D3D",inkMid:"#6B6B6B",inkFaint:"#A0A0A0",
  lime:"#C8F135",border:"#E8E5DE",borderMd:"#D1CCBF",
  green:"#166534",greenBg:"#DCFCE7",teal:"#0D7A6E",tealBg:"#E6F5F3",
  amber:"#B45309",amberBg:"#FEF3C7",red:"#991B1B",blue:"#1D4ED8",
};
const revenueData=[{month:"Set",usd:194,brl:994},{month:"Out",usd:388,brl:1988},{month:"Nov",usd:582,brl:2982},{month:"Dez",usd:970,brl:4970},{month:"Jan",usd:1358,brl:6958},{month:"Fev",usd:1940,brl:9940},{month:"Mar",usd:2522,brl:12908}];
const funnelData=[{stage:"Visitantes",value:1240,pct:100},{stage:"Cadastros",value:186,pct:15},{stage:"Briefings",value:93,pct:7.5},{stage:"Pagamentos",value:42,pct:3.4},{stage:"Entregas",value:41,pct:3.3}];
const productMix=[{name:"Landing Page Copy",value:18,color:"#111111"},{name:"Pacote de Posts",value:14,color:"#0D7A6E"},{name:"Sequência E-mails",value:10,color:"#1D4ED8"}];
const recentOrders=[{id:"#0041",client:"Eduardo M.",product:"Landing Page Copy",status:"entregue",value:"$97",time:"18h",flag:"🇧🇷"},{id:"#0040",client:"Carolina R.",product:"Pacote de Posts",status:"em produção",value:"$147",time:"6h",flag:"🇲🇽"},{id:"#0039",client:"James K.",product:"Seq. E-mails",status:"entregue",value:"$127",time:"31h",flag:"🇺🇸"},{id:"#0038",client:"Ana L.",product:"Landing Page Copy",status:"entregue",value:"R$497",time:"22h",flag:"🇧🇷"},{id:"#0037",client:"Miguel F.",product:"Pacote de Posts",status:"briefing",value:"$147",time:"—",flag:"🇦🇷"}];
const STATUS:Record<string,{color:string;bg:string}>={"entregue":{color:"#166534",bg:"#DCFCE7"},"em produção":{color:"#0D7A6E",bg:"#E6F5F3"},"briefing":{color:"#B45309",bg:"#FEF3C7"}};
function Card({children,style={}}:any){return <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:14,padding:"24px",boxShadow:"0 2px 8px rgba(0,0,0,0.04)",...style}}>{children}</div>}
function CardTitle({children}:any){return <div style={{fontSize:15,fontWeight:700,color:T.ink,marginBottom:20}}>{children}</div>}
function StatCard({label,value,sub,delta}:any){return(<Card><div style={{fontSize:11,fontWeight:600,color:T.inkFaint,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>{label}</div><div style={{fontSize:34,fontWeight:800,color:T.ink,lineHeight:1,marginBottom:6}}>{value}</div>{sub&&<div style={{fontSize:13,color:T.inkMid}}>{sub}</div>}{delta!==undefined&&<div style={{fontSize:12,fontWeight:600,color:delta>0?T.green:T.red,marginTop:8}}>{delta>0?"↑":"↓"} {Math.abs(delta)}% vs mês anterior</div>}</Card>)}
function TT({active,payload,label}:any){if(!active||!payload?.length)return null;return(<div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 14px",fontSize:13,boxShadow:"0 4px 16px rgba(0,0,0,0.1)"}}><div style={{color:T.inkMid,marginBottom:4,fontWeight:600}}>{label}</div>{payload.map((p:any,i:number)=><div key={i} style={{color:T.ink,fontWeight:700}}>{p.name==="usd"?"USD $":"BRL R$"}{p.value.toLocaleString()}</div>)}</div>)}
export default function OpsDashboard(){
  const [currency,setCurrency]=useState<"usd"|"brl">("usd");
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
        <StatCard label="Receita do Mês" value={currency==="usd"?"$2.522":"R$12.908"} sub="Março 2026" delta={30}/>
        <StatCard label="Pedidos" value="42" sub="este mês" delta={18}/>
        <StatCard label="Ticket Médio" value={currency==="usd"?"$120":"R$614"} delta={5}/>
        <StatCard label="Tempo de Entrega" value="22h" sub="média atual" delta={-8}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16,marginBottom:24}}>
        <Card>
          <CardTitle>Receita mensal ({currency.toUpperCase()})</CardTitle>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenueData}>
              <XAxis dataKey="month" tick={{fontSize:13,fill:T.inkMid}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:12,fill:T.inkMid}} axisLine={false} tickLine={false}/>
              <Tooltip content={<TT/>}/>
              <Line type="monotone" dataKey={currency} stroke={T.ink} strokeWidth={3} dot={{fill:T.lime,strokeWidth:0,r:5}}/>
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <CardTitle>Funil de conversão</CardTitle>
          {funnelData.map((item,i)=>(<div key={i} style={{marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <span style={{fontSize:13,fontWeight:600,color:T.inkSub}}>{item.stage}</span>
              <span style={{fontSize:13,fontWeight:800,color:T.ink}}>{item.value.toLocaleString()}</span>
            </div>
            <div style={{height:7,background:T.sand,borderRadius:99,overflow:"hidden",border:`1px solid ${T.border}`}}>
              <div style={{height:"100%",width:`${item.pct}%`,background:T.lime,borderRadius:99,opacity:1-i*0.15}}/>
            </div>
          </div>))}
        </Card>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:16}}>
        <Card>
          <CardTitle>Mix de produtos</CardTitle>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart><Pie data={productMix} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
              {productMix.map((e,i)=><Cell key={i} fill={e.color}/>)}
            </Pie><Tooltip formatter={(v:any)=>[`${v} pedidos`]} contentStyle={{background:T.white,border:`1px solid ${T.border}`,borderRadius:8,fontSize:13}}/></PieChart>
          </ResponsiveContainer>
          {productMix.map((p,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <span style={{width:10,height:10,borderRadius:"50%",background:p.color,flexShrink:0}}/>
            <span style={{fontSize:13,color:T.inkSub}}>{p.name}</span>
            <span style={{fontSize:13,fontWeight:800,color:T.ink,marginLeft:"auto"}}>{p.value}</span>
          </div>))}
        </Card>
        <Card>
          <CardTitle>Pedidos recentes</CardTitle>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>{["ID","Cliente","Produto","Status","Valor","Entrega"].map(h=><th key={h} style={{textAlign:"left",fontSize:11,fontWeight:700,color:T.inkFaint,textTransform:"uppercase",letterSpacing:"0.06em",paddingBottom:12,borderBottom:`2px solid ${T.border}`}}>{h}</th>)}</tr></thead>
            <tbody>{recentOrders.map((o,i)=>{const st=STATUS[o.status];return(<tr key={i}>
              <td style={{padding:"13px 0",fontSize:13,color:T.inkMid,fontWeight:600,borderBottom:`1px solid ${T.border}`}}>{o.id}</td>
              <td style={{padding:"13px 8px",fontSize:14,color:T.ink,fontWeight:600,borderBottom:`1px solid ${T.border}`}}>{o.flag} {o.client}</td>
              <td style={{padding:"13px 8px",fontSize:13,color:T.inkSub,borderBottom:`1px solid ${T.border}`}}>{o.product}</td>
              <td style={{padding:"13px 8px",borderBottom:`1px solid ${T.border}`}}><span style={{fontSize:11,fontWeight:700,color:st.color,background:st.bg,borderRadius:20,padding:"4px 12px"}}>{o.status}</span></td>
              <td style={{padding:"13px 8px",fontSize:14,fontWeight:800,color:T.ink,borderBottom:`1px solid ${T.border}`}}>{o.value}</td>
              <td style={{padding:"13px 0",fontSize:13,color:T.inkMid,fontWeight:600,borderBottom:`1px solid ${T.border}`}}>{o.time}</td>
            </tr>)})}</tbody>
          </table>
        </Card>
      </div>
    </div>
  </div>)}
