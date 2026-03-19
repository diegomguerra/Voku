import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(
  _req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const sb = supabaseAdmin();
    const orderId = params.orderId;

    // 1. Mark current active step as done
    const { data: activeStep } = await sb
      .from("project_steps")
      .select("id, phase_id")
      .eq("order_id", orderId)
      .eq("status", "active")
      .order("step_number")
      .limit(1)
      .single();

    if (activeStep) {
      await sb.from("project_steps").update({
        status: "done",
        completed_at: new Date().toISOString(),
      }).eq("id", activeStep.id);

      // 2. Activate next pending step
      const { data: nextStep } = await sb
        .from("project_steps")
        .select("id, phase_id")
        .eq("order_id", orderId)
        .eq("status", "pending")
        .order("step_number")
        .limit(1)
        .single();

      if (nextStep) {
        await sb.from("project_steps").update({ status: "active" }).eq("id", nextStep.id);

        // If next step is in a different phase, update phase statuses
        if (nextStep.phase_id !== activeStep.phase_id) {
          await sb.from("project_phases").update({ status: "done", completed_at: new Date().toISOString() }).eq("id", activeStep.phase_id);
          await sb.from("project_phases").update({ status: "active", started_at: new Date().toISOString() }).eq("id", nextStep.phase_id);
        }
      } else {
        // No more steps — mark current phase as done
        await sb.from("project_phases").update({ status: "done", completed_at: new Date().toISOString() }).eq("id", activeStep.phase_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
