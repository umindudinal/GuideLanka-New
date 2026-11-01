import Hero from '../components/home/Hero';
import Stats from '../components/home/Stats';
import Features from '../components/home/Features';
import WildlifeShowcase from '../components/home/WildlifeShowcase';
import HowItWorks from '../components/home/HowItWorks';

export default function Home() {
  return (
    <div className="space-y-0">
      <Hero />
      <Stats />
      <Features />
      <WildlifeShowcase />
      <HowItWorks />
    </div>
  );
}
