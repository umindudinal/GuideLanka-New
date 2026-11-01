import { Eye, Clock, TrendingUp } from 'lucide-react';
import leopardImg from '../../assets/Sri Lankan Leopard.jpg';
import elephantImg from '../../assets/Asian Elephant.jpg';
import slothBearImg from '../../assets/Sloth Bear.jpg';
import crocodileImg from '../../assets/Mugger Crocodile.jpg';

export default function WildlifeShowcase() {
  const wildlife = [
    {
      name: "Sri Lankan Leopard",
      scientificName: "Panthera pardus kotiya",
      image: leopardImg,
      sightingRate: "70%",
      sightingColor: "text-amber-600 bg-amber-50 border-amber-100",
      bestTime: "Dawn & Dusk",
      block: "Block 5"
    },
    {
      name: "Asian Elephant",
      scientificName: "Elephas maximus maximus",
      image: elephantImg,
      sightingRate: "95%",
      sightingColor: "text-emerald-600 bg-emerald-50 border-emerald-100",
      bestTime: "3:00 PM - 6:00 PM",
      block: "Block 6"
    },
    {
      name: "Sloth Bear",
      scientificName: "Melursus ursinus inornatus",
      image: slothBearImg,
      sightingRate: "35%",
      sightingColor: "text-rose-600 bg-rose-50 border-rose-100",
      bestTime: "Early Morning",
      block: "Block 5"
    },
    {
      name: "Mugger Crocodile",
      scientificName: "Crocodylus palustris",
      image: crocodileImg,
      sightingRate: "85%",
      sightingColor: "text-blue-600 bg-blue-50 border-blue-100",
      bestTime: "11:00 AM - 2:00 PM",
      block: "Block 5 Lakes"
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">

        <div className="text-center mb-10 md:mb-16 flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100 mb-3">
            <Eye size={12} />
            <span>YALA WILDLIFE HIGHLIGHTS</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-gray-800 mb-3 sm:mb-4 tracking-tight">
            Spot Yala's Iconic Species
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Yala National Park hosts a vibrant array of wildlife. Here are the most spotted species in Block 5 and Block 6, complete with real-time sighting predictions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {wildlife.map((animal, idx) => (
            <div key={idx} className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">

              <div className="h-48 overflow-hidden relative">
                <img
                  src={animal.image}
                  alt={animal.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/60 text-white backdrop-blur-sm">
                  {animal.block}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                    {animal.name}
                  </h3>
                  <p className="text-xs italic text-gray-400 mt-0.5">
                    {animal.scientificName}
                  </p>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-gray-50">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-medium flex items-center gap-1">
                      <TrendingUp size={12} />
                      Sighting Chance
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-bold border ${animal.sightingColor}`}>
                      {animal.sightingRate}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-medium flex items-center gap-1">
                      <Clock size={12} />
                      Peak Activity
                    </span>
                    <span className="font-bold text-gray-700">
                      {animal.bestTime}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
