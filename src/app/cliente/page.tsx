"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
const T = {
  sand:"#FAF8F3",white:"#FFFFFF",ink:"#111111",inkSub:"#3D3D3D",inkMid:"#6B6B6B",inkFaint:"#A0A0A0",
  lime:"#C8F135",border:"#E8E5DE",borderMd:"#D1CCBF",teal:"#0D7A6E",green:"#166534",red:"#991B1B",
};
const inputStyle={width:"100%",boxSizing:"border-box" as const,background:T.sand,border:`1.5px solid ${T.borderMd}`,borderRadius:10,padding:"12px 16px",fontSize:14,color:T.ink,fontFamily:"'Plus Jakarta Sans',sans-serif",outline:"none"};
export default function ClienteLoginPage(){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [name,setName]=useState("");
  const [mode,setMode]=useState<"login"|"register">("login");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const handleSubmit=async()=>{
    setLoading(true);setError("");setSuccess("");
    const sb = supabase();
    if(mode==="login"){
      const {error}=await sb.auth.signInWithPassword({email,password});
      if(error){setError("E-mail ou senha incorretos.");}
      else{window.location.href="/cliente/pedidos";}
    } else {
      const referredBy = typeof window !== "undefined" ? localStorage.getItem("voku_ref") : null;
      const {error,data:signUpData}=await sb.auth.signUp({email,password,options:{data:{name,referred_by:referredBy||undefined}}});
      if(error){setError(error.message);}
      else{
        setSuccess("Conta criada! Verifique seu e-mail para confirmar.");
        // Trigger onboarding emails
        const uid = signUpData?.user?.id;
        if(uid){
          fetch("/api/onboarding",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({user_id:uid,email,name})}).catch(()=>{});
          if(referredBy){
            sb.from("profiles").update({referred_by:referredBy}).eq("id",uid).then(()=>{});
            sb.from("affiliates").select("id").eq("codigo",referredBy).single().then(({data:aff})=>{
              if(aff) sb.from("affiliate_referrals").insert({affiliate_id:aff.id,referred_user_id:uid}).then(()=>{});
            });
            localStorage.removeItem("voku_ref");
          }
        }
      }
    }
    setLoading(false);
  };
  return(
    <div style={{background:T.sand,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Plus Jakarta Sans',sans-serif",backgroundImage:"radial-gradient(circle at 70% 20%, #e9f59e33 0%, transparent 60%)"}}>
      <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:20,padding:"48px 44px",width:"100%",maxWidth:440,boxShadow:"0 8px 40px rgba(0,0,0,0.08)"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{display:"inline-block",background:T.ink,color:"#fff",fontFamily:"'Inter', sans-serif",fontWeight:900,fontSize:28,letterSpacing:"-1px",padding:"6px 20px",borderRadius:10,marginBottom:16,textTransform:"uppercase" as const}}>VOKU</div>
          <div style={{fontSize:22,fontWeight:700,color:T.ink,marginBottom:6,letterSpacing:"-0.02em"}}>{mode==="login"?"Bem-vindo de volta":"Crie sua conta"}</div>
          <div style={{fontSize:14,color:T.inkMid}}>{mode==="login"?"Acesse seus pedidos e faça downloads":"Comece a receber seus projetos em 24h"}</div>
        </div>
        {mode==="register"&&(
          <div style={{marginBottom:18}}>
            <label style={{display:"block",fontSize:13,fontWeight:600,color:T.inkSub,marginBottom:7}}>Nome completo</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Seu nome completo" style={inputStyle}/>
          </div>
        )}
        <div style={{marginBottom:18}}>
          <label style={{display:"block",fontSize:13,fontWeight:600,color:T.inkSub,marginBottom:7}}>E-mail</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" style={inputStyle}/>
        </div>
        <div style={{marginBottom:mode==="login"?8:24}}>
          <label style={{display:"block",fontSize:13,fontWeight:600,color:T.inkSub,marginBottom:7}}>Senha</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" onKeyDown={e=>e.key==="Enter"&&handleSubmit()} style={inputStyle}/>
        </div>
        {mode==="login"&&<div style={{textAlign:"right",marginBottom:20}}><button style={{background:"none",border:"none",color:T.teal,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Esqueci minha senha</button></div>}
        {error&&<div style={{color:T.red,fontSize:13,marginBottom:16,padding:"10px 14px",background:"#FEE2E2",borderRadius:8}}>{error}</div>}
        {success&&<div style={{color:T.green,fontSize:13,marginBottom:16,padding:"10px 14px",background:"#DCFCE7",borderRadius:8}}>{success}</div>}
        <button onClick={handleSubmit} disabled={loading} style={{width:"100%",background:loading?T.inkMid:T.ink,color:T.lime,border:"none",borderRadius:12,padding:"14px",fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit"}}>
          {loading?"...":(mode==="login"?"Entrar →":"Criar conta →")}
        </button>
        <div style={{display:"flex",alignItems:"center",gap:12,margin:"24px 0"}}>
          <div style={{flex:1,height:1,background:T.border}}/><span style={{fontSize:12,color:T.inkFaint}}>ou</span><div style={{flex:1,height:1,background:T.border}}/>
        </div>
        <div style={{textAlign:"center"}}>
          <span style={{fontSize:13,color:T.inkMid}}>{mode==="login"?"Não tem conta? ":"Já tem conta? "}</span>
          <button onClick={()=>{setMode(mode==="login"?"register":"login");setError("");setSuccess("");}} style={{background:"none",border:"none",color:T.teal,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            {mode==="login"?"Criar agora":"Entrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
