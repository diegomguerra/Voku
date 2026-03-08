"use client";
import { useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
const T = {
  sand:"#FAF8F3",white:"#FFFFFF",ink:"#111111",inkSub:"#3D3D3D",inkMid:"#6B6B6B",inkFaint:"#A0A0A0",
  lime:"#C8F135",border:"#E8E5DE",borderMd:"#D1CCBF",
  green:"#166534",greenBg:"#DCFCE7",teal:"#0D7A6E",tealBg:"#E6F5F3",
  red:"#991B1B",redBg:"#FEE2E2",purple:"#6D28D9",purpleBg:"#EDE9FE",
};
const followersData=[{month:"Out",ig:420,tt:180,yt:90},{month:"Nov",ig:680,tt:340,yt:145},{month:"Dez",ig:920,tt:580,yt:210},{month:"Jan",ig:1340,tt:890,yt:320},{month:"Fev",ig:1820,tt:1240,yt:480},{month:"Mar",ig:2480,tt:1780,yt:650}];
const spendLeads=[{month:"Jan",spend:0,leads:12},{month:"Fev",spend:200,leads:31},{month:"Mar",spend:450,leads:68}];
const posts=[{plat:"Instagram",title:"3 erros que destroem sua landing page",views:"12.4k",eng:"8.2%",leads:14,date:"05/03"},{plat:"TikTok",title:"Como escrever um e-mail que vende em 5 min",views:"38.7k",eng:"11.4%",leads:28,date:"04/03"},{plat:"YouTube",title:"Bastidores: como entrego em 24h com IA",views:"3.2k",eng:"9.1%",leads:21,date:"01/03"},{plat:"TikTok",title:"Quanto cobrar por copy?",views:"51.2k",eng:"14.3%",leads:37,date:"28/02"}];
const PLAT:Record<string,{color:string;bg:string;emoji:string}>={Instagram:{color:T.purple,bg:T.purpleBg,emoji:"📸"},TikTok:{color:T.ink,bg:T.sand,emoji:"🎵"},YouTube:{color:T.red,bg:T.redBg,emoji:"▶️"}};
function Card({children,style={}}:any){return <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:14,padding:"24px",boxShadow:"0 2px 8px rgba(0,0,0,0.04)",...style}}>{children}</div>}
function CardTitle({children}:any){return <div style={{fontSize:15,fontWeight:700,color:T.ink,marginBottom:20}}>{children}</div>}
function TT({active,payload,label}:any){if(!active||!payload?.length)return null;return(<div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 14px",fontSize:13,boxShadow:"0 4px 16px rgba(0,0,0,0.1)"}}><div style={{color:T.inkMid,marginBottom:4,fontWeight:600}}>{label}</div>{payload.map((p:any,i:number)=><div key={i} style={{color:T.ink,fontWeight:700}}>{p.name}: {p.value.toLocaleString()}</div>)}</div>)}
export default function MediaDashboard(){
  return(<div style={{background:T.sand,minHeight:"100vh",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
    <div style={{background:T.white,borderBottom:`1px solid ${T.border}`,padding:"0 40px",display:"flex",alignItems:"center",height:64,gap:16}}>
      <div style={{background:T.ink,color:T.lime,fontFamily:"Georgia,serif",fontStyle:"italic",fontSize:20,padding:"4px 14px",borderRadius:6}}>Voku</div>
      <span style={{color:T.borderMd,fontSize:20}}>|</span>
      <span style={{fontSize:15,fontWeight:700,color:T.inkSub}}>Dashboard de Mídia</span>
      <a href="/admin/dashboard" style={{fontSize:13,color:T.teal,fontWeight:600,textDecoration:"none",marginLeft:8}}>← Operacional</a>
    </div>
    <div style={{padding:"32px 40px",maxWidth:1200,margin:"0 auto"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:24}}>
        {[{name:"Instagram",followers:"2.480",delta:"36",eng:"7.4%",color:T.purple,bg:T.purpleBg,emoji:"📸"},{name:"TikTok",followers:"1.780",delta:"43",eng:"11.2%",color:T.ink,bg:T.sand,emoji:"🎵"},{name:"YouTube",followers:"650",delta:"35",eng:"9.1%",color:T.red,bg:T.redBg,emoji:"▶️"}].map(p=>(
          <Card key={p.name}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:22}}>{p.emoji}</span><span style={{fontSize:15,fontWeight:700,color:T.ink}}>{p.name}</span></div>
              <span style={{fontSize:11,fontWeight:700,color:p.color,background:p.bg,borderRadius:20,padding:"4px 12px"}}>+{p.delta}% mês</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[{label:"Seguidores",value:p.followers,color:T.ink},{label:"Engajamento",value:p.eng,color:T.teal}].map(s=>(
                <div key={s.label} style={{background:T.sand,borderRadius:10,padding:"14px",border:`1px solid ${T.border}`}}>
                  <div style={{fontSize:11,color:T.inkFaint,fontWeight:600,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>{s.label}</div>
                  <div style={{fontSize:26,fontWeight:800,color:s.color}}>{s.value}</div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16,marginBottom:24}}>
        <Card>
          <CardTitle>Crescimento de seguidores</CardTitle>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={followersData}>
              <XAxis dataKey="month" tick={{fontSize:13,fill:T.inkMid}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:12,fill:T.inkMid}} axisLine={false} tickLine={false}/>
              <Tooltip content={<TT/>}/>
              <Line type="monotone" dataKey="ig" name="Instagram" stroke={T.purple} strokeWidth={2.5} dot={false}/>
              <Line type="monotone" dataKey="tt" name="TikTok" stroke={T.ink} strokeWidth={2.5} dot={false}/>
              <Line type="monotone" dataKey="yt" name="YouTube" stroke={T.red} strokeWidth={2.5} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <CardTitle>Investimento vs Leads</CardTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={spendLeads}>
              <XAxis dataKey="month" tick={{fontSize:13,fill:T.inkMid}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:12,fill:T.inkMid}} axisLine={false} tickLine={false}/>
              <Tooltip content={<TT/>}/>
              <Bar dataKey="spend" name="Investimento $" fill={T.borderMd} radius={[4,4,0,0]}/>
              <Bar dataKey="leads" name="Leads" fill={T.lime} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Card>
        <CardTitle>Performance dos posts</CardTitle>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>{["Plataforma","Título","Views","Engajamento","Leads","Data"].map(h=><th key={h} style={{textAlign:"left",fontSize:11,fontWeight:700,color:T.inkFaint,textTransform:"uppercase",letterSpacing:"0.06em",paddingBottom:12,borderBottom:`2px solid ${T.border}`}}>{h}</th>)}</tr></thead>
          <tbody>{posts.map((p,i)=>{const pl=PLAT[p.plat];return(<tr key={i}>
            <td style={{padding:"13px 0",borderBottom:`1px solid ${T.border}`}}><span style={{fontSize:11,fontWeight:700,color:pl.color,background:pl.bg,borderRadius:20,padding:"4px 12px"}}>{pl.emoji} {p.plat}</span></td>
            <td style={{padding:"13px 12px",fontSize:13,color:T.inkSub,borderBottom:`1px solid ${T.border}`}}>{p.title}</td>
            <td style={{padding:"13px 12px",fontSize:14,fontWeight:800,color:T.ink,borderBottom:`1px solid ${T.border}`}}>{p.views}</td>
            <td style={{padding:"13px 12px",fontSize:14,fontWeight:800,color:T.teal,borderBottom:`1px solid ${T.border}`}}>{p.eng}</td>
            <td style={{padding:"13px 12px",borderBottom:`1px solid ${T.border}`}}><span style={{fontSize:13,fontWeight:800,color:T.green,background:T.greenBg,borderRadius:20,padding:"4px 12px"}}>{p.leads} leads</span></td>
            <td style={{padding:"13px 0",fontSize:13,color:T.inkMid,fontWeight:600,borderBottom:`1px solid ${T.border}`}}>{p.date}</td>
          </tr>)})}</tbody>
        </table>
      </Card>
    </div>
  </div>)}
