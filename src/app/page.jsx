import dynamic from "next/dynamic";

const LandingClient = dynamic(() => import("./LandingClient"), {
  ssr: false,
  loading: () => null,
});

export default function Page() {
  return <LandingClient />;
}
