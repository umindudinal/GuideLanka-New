import { CalendarRange, Map, ShieldAlert, Sparkles } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: <CalendarRange className="text-green-600" size={24} />,
      title: "Book Your Safari Jeep",
      desc: "Compare registered local drivers, read visitor reviews, and reserve your preferred safari vehicle slot online."
    },
    {
      number: "02",
      icon: <Map className="text-green-600" size={24} />,
      title: "Track Sighting Routes",
      desc: "Access our live Sighting-to-Route (S2R) tracker on safari day to coordinate coordinates with your driver in real-time."
    },
    {
      number: "03",
      icon: <ShieldAlert className="text-green-600" size={24} />,
      title: "Observe Ethically",
      desc: "Observe wildlife from safety, follow official ranger codes of conduct, and log new sightings to help other visitors."
    }
  ];

  return (
    <section className="py-14 sm:py-20 md:py-24 bg-gray-50/50 relative overflow-hidden">

      <div className="absolute top-20 left-10 w-48 h-48 bg-green-500/5 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>

      <div className="container mx-auto px-4 max-w-6xl relative z-10">

        <div className="text-center mb-10 sm:mb-16 md:mb-20 flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-green-50 text-green-700 border border-green-100 mb-2 sm:mb-3">
            <Sparkles size={12} />
            <span>HOW IT WORKS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-gray-800 mb-2.5 sm:mb-4 tracking-tight px-2">
            Your Safari Journey, Simplified
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed px-2">
            Get from booking to Yala's wild tracks in three easy, digital steps designed to make tracking seamless and eco-friendly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12 relative">

          <div className="hidden md:block absolute top-1/2 left-1/6 right-1/6 h-0.5 border-t border-dashed border-gray-200 -translate-y-8 z-0"></div>

          {steps.map((step, idx) => (
            <div key={idx} className="relative flex flex-col items-center text-center space-y-3 sm:space-y-5 group z-10">

              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-white border border-gray-100 flex items-center justify-center text-green-600 shadow-md group-hover:shadow-lg transition-shadow relative">
                {step.icon}
                <div className="absolute -top-2.5 -right-2.5 sm:-top-3 sm:-right-3 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-green-600 text-white text-[10px] sm:text-xs font-black flex items-center justify-center border-2 sm:border-4 border-gray-50">
                  {step.number}
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2 max-w-xs">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                  {step.desc}
                </p>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
