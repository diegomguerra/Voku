import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (_req: Request) => {
  const html = atob('PLACEHOLDER');
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
});
