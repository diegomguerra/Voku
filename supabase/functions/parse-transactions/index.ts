import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ParsedTransaction = {
  description?: string;
  amount?: number | string;
  occurred_on?: string | null;
  ttype?: 'income' | 'expense' | string;
  category_id?: string | null;
  cost_center_id?: string | null;
  meta?: {
    due_date?: string | null;
    payment_method?: string | null;
    recurrence?: Record<string, unknown> | null;
  } | null;
};

type ParsedResult = {
  transactions?: ParsedTransaction[] | null;
};

type TransactionInsertPayload = {
  user_id: string;
  description: string;
  amount: number;
  occurred_on: string;
  ttype: 'income' | 'expense';
  category_id: string | null;
  cost_center_id: string | null;
  meta: Record<string, unknown>;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transactionText } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não está configurada");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Authorization header missing");
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error("Token de usuário inválido");
    }

    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, type')
      .eq('user_id', user.id);

    const { data: costCenters } = await supabase
      .from('cost_centers')
      .select('id, name')
      .eq('user_id', user.id);

    const systemPrompt = `Você é um assistente especializado em categorizar lançamentos financeiros.
Analise o texto fornecido e extraia todos os lançamentos (receitas e despesas) mencionados.

O texto pode estar em formato livre OU em formato tabular com as seguintes colunas:
- Descrição: descrição do lançamento
- Centro de Custo: nome do centro de custo
- Valor: valor monetário
- Data do vencimento: data de vencimento
- Método de pagamento: como foi pago (cartão de crédito, dinheiro, pix, etc)
- Recorrente: se é recorrente e tipo (mensal, anual, etc)

Categorias de RECEITA disponíveis:
${categories?.filter(c => c.type === 'income').map(c => `- ${c.name} (${c.id})`).join('\n')}

Categorias de DESPESA disponíveis:
${categories?.filter(c => c.type === 'expense').map(c => `- ${c.name} (${c.id})`).join('\n')}

Centros de custo disponíveis:
${costCenters?.map(cc => `- ${cc.name} (${cc.id})`).join('\n')}

Regras importantes:
- Se o valor for positivo ou mencionar "recebido", "salário", "renda", é uma RECEITA (ttype: "income")
- Caso contrário, é uma DESPESA (ttype: "expense")
- O campo "amount" deve ser sempre POSITIVO (número sem sinal)
- Se não encontrar uma categoria adequada, use null para category_id
- Encontre o centro de custo pelo NOME na lista acima
- Se não encontrar centro de custo, use null para cost_center_id
- A data do vencimento (due_date) deve ser armazenada em meta.due_date
- O método de pagamento (payment_method) deve ser armazenado em meta.payment_method
- Se for recorrente, armazene em meta.recurrence: { type: "monthly" | "annual" | etc, count: número }

Retorne um JSON com array "transactions" contendo objetos com:
- description: descrição do lançamento
- amount: valor numérico positivo (apenas números, sem R$ ou vírgulas)
- occurred_on: data no formato YYYY-MM-DD (use a data de vencimento mencionada ou hoje se não especificada: ${new Date().toISOString().split('T')[0]})
- ttype: "income" para receitas ou "expense" para despesas
- category_id: UUID da categoria mais apropriada ou null
- cost_center_id: UUID do centro de custo correspondente ao nome mencionado ou null
- meta: objeto com campos opcionais:
  - due_date: "YYYY-MM-DD" se mencionado
  - payment_method: string se mencionado
  - recurrence: { type: string, count: number } se for recorrente

Formato de resposta:
{
  "transactions": [
    {
      "description": "string",
      "amount": number,
      "occurred_on": "YYYY-MM-DD",
      "ttype": "income" ou "expense",
      "category_id": "uuid ou null",
      "cost_center_id": "uuid ou null",
      "meta": {
        "due_date": "YYYY-MM-DD ou null",
        "payment_method": "string ou null",
        "recurrence": { "type": "string", "count": number } ou null
      }
    }
  ]
}`;

    console.log('Chamando IA para processar lançamentos...');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transactionText }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente mais tarde." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao seu workspace Lovable." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('Erro da IA:', response.status, errorText);
      throw new Error(`Falha ao processar com IA: ${response.status}`);
    }

    const data = await response.json();
    const choiceContent = data?.choices?.[0]?.message?.content;
    let parsedResult: ParsedResult;

    if (typeof choiceContent === 'string') {
      try {
        parsedResult = JSON.parse(choiceContent);
      } catch (parseError) {
        console.error('Falha ao interpretar resposta da IA (string):', parseError, data);
        return new Response(
          JSON.stringify({ error: 'Resposta da IA em formato inválido. Tente novamente.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (choiceContent && typeof choiceContent === 'object') {
      parsedResult = choiceContent;
    } else {
      console.error('Resposta da IA sem conteúdo utilizável:', data);
      return new Response(
        JSON.stringify({ error: 'Não foi possível interpretar a resposta da IA. Tente novamente.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!parsedResult?.transactions || !Array.isArray(parsedResult.transactions)) {
      console.error('Resposta da IA não contém transações válidas:', parsedResult);
      return new Response(
        JSON.stringify({ error: 'Nenhum lançamento foi identificado na resposta da IA.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const todayIso = new Date().toISOString().split('T')[0];

    const normalizeDate = (dateString?: string | null) => {
      if (!dateString || typeof dateString !== 'string') {
        return todayIso;
      }

      const trimmed = dateString.trim();
      const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);

      if (!match) {
        return todayIso;
      }

      const [, yearStr, monthStr, dayStr] = match;
      const year = Number(yearStr);
      const month = Number(monthStr);
      const day = Number(dayStr);

      if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
        return todayIso;
      }

      if (month < 1 || month > 12) {
        return todayIso;
      }

      const daysInMonth = new Date(year, month, 0).getDate();
      const safeDay = Math.min(Math.max(day, 1), daysInMonth);
      const normalizedDate = new Date(Date.UTC(year, month - 1, safeDay));

      return normalizedDate.toISOString().split('T')[0];
    };

    console.log('IA retornou:', parsedResult);

    const sanitizeAmount = (rawAmount: ParsedTransaction['amount']) => {
      if (typeof rawAmount === 'number' && Number.isFinite(rawAmount)) {
        return Math.abs(rawAmount);
      }

      if (typeof rawAmount === 'string') {
        const cleaned = rawAmount
          .replace(/R\$|\s/g, '')
          .replace(/\./g, '')
          .replace(/,/g, '.');
        const parsed = Number(cleaned);
        if (Number.isFinite(parsed)) {
          return Math.abs(parsed);
        }
      }

      return null;
    };

    const validTransactions = parsedResult.transactions.filter(
      (tx): tx is ParsedTransaction => !!tx && typeof tx === 'object'
    );

    const transactionsToInsert = validTransactions
      .map<TransactionInsertPayload | null>((tx) => {
        const amount = sanitizeAmount(tx.amount);
        if (amount === null) {
          console.warn('Transação ignorada por valor inválido:', tx);
          return null;
        }

        if (!tx.description || typeof tx.description !== 'string') {
          console.warn('Transação ignorada por descrição inválida:', tx);
          return null;
        }

        if (tx.ttype !== 'income' && tx.ttype !== 'expense') {
          console.warn('Transação ignorada por tipo inválido:', tx);
          return null;
        }

        return {
          user_id: user.id,
          description: tx.description,
          amount,
          occurred_on: normalizeDate(tx.occurred_on),
          ttype: tx.ttype,
          category_id: tx.category_id || null,
          cost_center_id: tx.cost_center_id || null,
          meta: {
            ai_classified: true,
            ...(tx.meta?.due_date && { due_date: normalizeDate(tx.meta.due_date) }),
            ...(tx.meta?.payment_method && { payment_method: tx.meta.payment_method }),
            ...(tx.meta?.recurrence && { recurrence: tx.meta.recurrence })
          }
        };
      })
      .filter((tx): tx is TransactionInsertPayload => tx !== null);

    if (!transactionsToInsert.length) {
      console.error('Nenhum lançamento válido para inserir:', parsedResult.transactions);
      return new Response(
        JSON.stringify({ error: 'Nenhum lançamento válido identificado. Revise o texto e tente novamente.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: insertedTransactions, error: insertError } = await supabase
      .from('transactions')
      .insert(transactionsToInsert)
      .select();

    if (insertError) {
      console.error('Erro ao inserir lançamentos:', insertError);
      throw insertError;
    }

    console.log(`${insertedTransactions?.length || 0} lançamentos inseridos com sucesso`);

    return new Response(
      JSON.stringify({
        success: true,
        count: insertedTransactions?.length || 0,
        transactions: insertedTransactions
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função parse-transactions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
