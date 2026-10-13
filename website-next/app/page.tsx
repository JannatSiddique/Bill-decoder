import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Pipeline from "@/components/Pipeline";
import Outputs from "@/components/Outputs";
import Results from "@/components/Results";
import Questions from "@/components/Questions";
import Design from "@/components/Design";
import QuickStart from "@/components/QuickStart";
import Footer from "@/components/Footer";
import { loadBills, loadAnswers, countUnavailable } from "@/lib/bills";

export default function Home() {
  const bills = loadBills();
  const answers = loadAnswers();
  const { total, unavailable } = countUnavailable(answers);

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Pipeline />
        <Outputs />
        <Results bills={bills} total={total} unavailable={unavailable} />
        <Questions answers={answers} />
        <Design />
        <QuickStart />
      </main>
      <Footer />
    </>
  );
}
