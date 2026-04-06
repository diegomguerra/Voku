import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Marquee from "@/components/landing/Marquee";
import Portfolio from "@/components/landing/Portfolio";
import Pricing from "@/components/landing/Pricing";
import Process from "@/components/landing/Process";
import Guarantee from "@/components/landing/Guarantee";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navbar />
      <Hero />
      <Marquee />
      <Portfolio />
      <Pricing />
      <Process />
      <Guarantee />
      <Footer />
    </div>
  );
}
