import { Car, MapPin, ShieldCheck, Compass } from 'lucide-react';
import feature01 from '../../assets/features-01.jpg';
import feature02 from '../../assets/features-02.jpg';
import feature03 from '../../assets/features-03.jpg';

export default function Features() {
  const features = [
    {
      image: feature01,
      icon: <Car size={24} />,
      title: "Seamless Booking",
      desc: "Reserve your safari vehicle and choose your preferred time slot in advance. Complete your reservation online with no long queues.",
    },
    {
      image: feature02,
      icon: <MapPin size={24} />,
      title: "Smart S2R Tracking",
      desc: "Our real-time Sighting-to-Route tracking coordinates live animal spots so you can explore Yala Block 5 & 6 with maximum sighting chances.",
    },
    {
      image: feature03,
      icon: <ShieldCheck size={24} />,
      title: "Safe & Guided",
      desc: "Travel securely under the instructions of certified professional guides. Receive dynamic safety notifications directly from park rangers.",
    }
  ];

  return (
    <section id="features" className="py-16 md:py-24 bg-gray-50/50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-10 md:mb-16 flex flex-col items-center">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-gray-800 mb-3 sm:mb-4 tracking-tight">
            Why Choose GuideLanka?
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
            We bridge digital technology with nature. Experience a structured, ethical, and optimized safari tracking journey through our cutting-edge capabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-white rounded-3xl shadow-sm hover:shadow-xl border border-gray-100 hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col relative"
            >
              <div className="h-48 sm:h-56 overflow-hidden relative">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ease-in-out"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent"></div>

                <div className="absolute bottom-4 right-4 bg-white w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-green-700 shadow-md border border-gray-50">
                  {feature.icon}
                </div>
              </div>

              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-gray-800 mb-2 sm:mb-3 group-hover:text-green-700 transition-colors">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-xs sm:text-sm">
                    {feature.desc}
                  </p>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
