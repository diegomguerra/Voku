import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Voku V2 — Plano de Reestruturação",
};

export default function VokuV2Page() {
  return (
    <iframe
      src="/voku-v2-plan.html"
      style={{
        width: "100%",
        height: "100vh",
        border: "none",
        display: "block",
      }}
      title="Voku V2 — Plano de Reestruturação"
    />
  );
}
