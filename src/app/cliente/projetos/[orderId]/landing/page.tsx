'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import LandingPageViewer from '@/components/LandingPageViewer';

export default function LandingPagePage({
  params,
}: {
  params: { orderId: string };
}) {
  const [order, setOrder]     = useState<any>(null);
  const [choices, setChoices] = useState<any[]>([]);
  const [user, setUser]       = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await sb.auth.getUser();
      setUser(u);

      const { data: o } = await sb
        .from('orders')
        .select('*')
        .eq('id', params.orderId)
        .single();
      setOrder(o);

      const { data: c } = await sb
        .from('choices')
        .select('*')
        .eq('order_id', params.orderId)
        .order('created_at', { ascending: true });
      setChoices(c || []);

      setLoading(false);
    }
    load();
  }, [params.orderId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid #e2e8f0', borderTopColor: '#CCEE33', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#64748b', fontSize: 14 }}>Carregando...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
        Projeto não encontrado.
      </div>
    );
  }

  const structuredData = order.structured_data
    || choices[0]?.content?.briefing
    || {
        produto: order.preview_text?.slice(0, 100) || 'Produto',
        publico: 'Público-alvo',
        objetivo: 'Geração de leads',
        tom: 'profissional',
        brand_context: { nome_marca: 'Marca' },
      };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 100, border: '1px solid #bbf7d0' }}>
            LANDING PAGE
          </span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Landing Page
        </h1>
        <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
          Gere, visualize o preview e baixe o HTML para publicar no seu servidor.
        </p>
      </div>

      {/* Viewer */}
      <LandingPageViewer
        orderId={order.id}
        choiceId={choices[0]?.id}
        userId={user?.id || ''}
        prefill={structuredData ? { nome_marca: structuredData.brand_context?.nome_marca || structuredData.nome_marca, produto: structuredData.produto, publico: structuredData.publico, objetivos: Array.isArray(structuredData.objetivos) ? structuredData.objetivos : structuredData.objetivo ? [structuredData.objetivo] : [], tom: structuredData.tom } : undefined}
        initialHtml={choices[0]?.html_content || ''}
      />

      {/* Instruções */}
      <div style={{ marginTop: 24, padding: 20, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>
          Como publicar sua landing page
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { num: '01', title: 'Gere e revise', desc: 'Clique em gerar e veja o preview. Se quiser ajustes, regenere.' },
            { num: '02', title: 'Baixe o HTML', desc: 'Clique em "Baixar" — você recebe um arquivo .html completo e standalone.' },
            { num: '03', title: 'Publique', desc: 'Faça upload no Netlify, Vercel, cPanel ou qualquer servidor. Zero dependência.' },
          ].map(item => (
            <div key={item.num} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 800, fontSize: 16, color: '#CCEE33', flexShrink: 0, fontFamily: 'monospace' }}>{item.num}</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', marginBottom: 4 }}>{item.title}</p>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
