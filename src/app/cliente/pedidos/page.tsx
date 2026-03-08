"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
const T = {
  sand:"#FAF8F3",white:"#FFFFFF",ink:"#111111",inkSub:"#3D3D3D",inkMid:"#6B6B6B",inkFaint:"#A0A0A0",
  lime:"#C8F135",border:"#E8E5DE",borderMd:"#D1CCBF",
  green:"#166534",greenBg:"#DCFCE7",teal:"#0D7A6E",tealBg:"#E6F5F3",amber:"#B45309",amberBg:"#FEF3C7",
};
const PRODUCT_NAME:Record<string,string>={landing_page_copy:"Landing Page Copy",content_pack:"Pacote de Conteúdo para Redes",email_sequence:"Sequência de E-mails de Nutrição"};
const STATUS:Record<string,{label:string;color:string;bg:string;dot:string}>={briefing:{label:"Briefing",color:T.amber,bg:T.amberBg,dot:"#F59E0B"},in_production:{label:"Em Produção",color:T.teal,bg:T.tealBg,dot:"#0D9488"},delivered:{label:"Entregue",color:T.green,bg:T.greenBg,dot:"#16A34A"}};
export default function PedidosPage(){
  const [user,setUser]=useState<any>(null);
  const [orders,setOrders]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    const sb = supabase();
    sb.auth.getUser().then(({data})=>{
      if(!data.user){window.location.href="/cliente";return;}
      setUser(data.user);
      sb.from("orders").select("*,deliverables(*)").eq("user_id",data.user.id).order("created_at",{ascending:false}).then(({data:orders})=>{setOrders(orders||[]);setLoading(false);});
    });
  },[]);
  const handleDownload=async(order:any)=>{
    const d=order.deliverables?.[0];if(!d)return;
    const sb = supabase();
    const {data}=await sb.storage.from("deliverables").createSignedUrl(d.file_path,3600);
    if(data?.signedUrl)window.open(data.signedUrl,"_blank");
  };
  const handleLogout=async()=>{const sb = supabase();await sb.auth.signOut();window.location.href="/cliente";};
  if(loading)return(<div style={{background:T.sand,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:T.inkMid,fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:15}}>Carregando...</div>);
  return(
    <div style={{background:T.sand,minHeight:"100vh",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <div style={{background:T.white,borderBottom:`1px solid ${T.border}`,padding:"0 40px",display:"flex",alignItems:"center",justifyContent:"space-between",height:64}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{background:T.ink,color:T.lime,fontFamily:"Georgia,serif",fontStyle:"italic",fontSize:20,padding:"4px 14px",borderRadius:6}}>Voku</div>
          <span style={{color:T.borderMd,fontSize:20}}>|</span>
          <span style={{fontSize:15,fontWeight:700,color:T.inkSub}}>Meus Pedidos</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <span style={{color:T.inkMid,fontSize:13}}>{user?.email}</span>
          <button onClick={handleLogout} style={{background:"transparent",border:`1.5px solid ${T.borderMd}`,color:T.inkSub,borderRadius:8,padding:"6px 18px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Sair</button>
        </div>
      </div>
      <div style={{padding:"32px 40px",maxWidth:880,margin:"0 auto"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:28}}>
          {[{label:"Total de pedidos",value:orders.length.toString(),color:T.ink},{label:"Em andamento",value:orders.filter(o=>o.status==="in_production").length.toString(),color:T.teal},{label:"Entregues",value:orders.filter(o=>o.status==="delivered").length.toString(),color:T.green}].map(s=>(
            <div key={s.label} style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:16,padding:"22px 24px",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
              <div style={{fontSize:12,color:T.inkMid,fontWeight:600,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.06em"}}>{s.label}</div>
              <div style={{fontSize:36,fontWeight:800,color:s.color,lineHeight:1}}>{s.value}</div>
            </div>
          ))}
        </div>
        {orders.length===0?(
          <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:16,padding:"60px 40px",textAlign:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
            <div style={{fontSize:32,marginBottom:16}}>✦</div>
            <div style={{fontSize:16,fontWeight:700,color:T.ink,marginBottom:8}}>Nenhum pedido ainda.</div>
            <div style={{fontSize:14,color:T.inkMid,marginBottom:24}}>Escolha um produto e comece agora.</div>
            <a href="/" style={{background:T.lime,color:T.ink,padding:"12px 28px",borderRadius:10,textDecoration:"none",fontSize:14,fontWeight:700}}>Ver produtos →</a>
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {orders.map((order)=>{
              const st=STATUS[order.status]||STATUS.briefing;
              const deadline=order.delivery_deadline?new Date(order.delivery_deadline):null;
              return(
                <div key={order.id} style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:18,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.05)"}}>
                  <div style={{padding:"20px 28px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div>
                      <div style={{fontSize:17,fontWeight:700,color:T.ink,marginBottom:4}}>{PRODUCT_NAME[order.product]||order.product}</div>
                      <div style={{fontSize:12,color:T.inkFaint}}>Pedido #{order.order_number}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:7,background:st.bg,color:st.color,borderRadius:20,padding:"6px 14px 6px 10px",fontSize:12,fontWeight:700}}>
                      <span style={{width:7,height:7,borderRadius:"50%",background:st.dot,display:"inline-block"}}/>
                      {st.label}
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",borderTop:`1px solid ${T.border}`,borderBottom:`1px solid ${T.border}`}}>
                    {[{label:"Valor",value:`${order.currency} ${order.amount}`},{label:"Pedido em",value:new Date(order.created_at).toLocaleDateString("pt-BR")},{label:"Entrega até",value:deadline?deadline.toLocaleDateString("pt-BR"):"—"}].map((item,i)=>(
                      <div key={item.label} style={{padding:"14px 28px",borderRight:i<2?`1px solid ${T.border}`:"none"}}>
                        <div style={{fontSize:11,color:T.inkFaint,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>{item.label}</div>
                        <div style={{fontSize:15,fontWeight:700,color:T.ink}}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{padding:"16px 28px"}}>
                    {order.status==="delivered"&&<button onClick={()=>handleDownload(order)} style={{background:T.lime,color:T.ink,border:"none",borderRadius:10,padding:"10px 24px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>↓ Fazer download</button>}
                    {order.status==="in_production"&&<div style={{color:T.teal,fontSize:13,fontWeight:600}}>⏳ Arquivo sendo preparado — entrega até {deadline?.toLocaleDateString("pt-BR")}</div>}
                    {order.status==="briefing"&&<div style={{color:T.amber,fontSize:13,fontWeight:600}}>📋 Aguardando confirmação do briefing</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div style={{marginTop:28,background:T.ink,borderRadius:18,padding:"28px 32px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:17,fontWeight:700,color:"#FFFFFF",marginBottom:4}}>Precisa de mais conteúdo?</div>
            <div style={{fontSize:13,color:"#A0A0A0"}}>Novo pedido entregue em 24h.</div>
          </div>
          <a href="/" style={{background:T.lime,color:T.ink,border:"none",borderRadius:10,padding:"12px 24px",fontSize:13,fontWeight:700,cursor:"pointer",textDecoration:"none"}}>Ver produtos →</a>
        </div>
      </div>
    </div>
  );
}
