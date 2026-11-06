import { Shield, Compass, Camera, MapPin, Trees, ChevronRight, Award, Ticket, Globe, Coins, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroBg from '../assets/background.jpg';

export default function AboutPage() {
  const stats = [
    { value: "400+ km²", label: "Protected Area" },
    { value: "35+", label: "Resident Leopards" },
    { value: "180+", label: "Bird Species" },
    { value: "0% / Low", label: "Jeep Traffic" }
  ];

  return (
    <div className="pt-24 pb-16 bg-gray-50/50 min-h-screen font-sans">
      
      {/* Full-width Hero Banner matching the signature GuideLanka style */}
      <div 
        className="relative w-full h-70 sm:h-85 md:h-100 overflow-hidden bg-cover bg-center mb-8 sm:mb-12 shadow-md"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-linear-to-t from-gray-950 via-gray-900/50 to-black/30 flex flex-col items-center justify-center p-4 sm:p-6 text-center z-10">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-2 sm:mb-4 tracking-tight leading-tight">
            Discover Yala Block 5 & 6
          </h1>
          <p className="text-gray-200 text-xs sm:text-base md:text-lg max-w-xl font-medium leading-relaxed px-2">
            Step away from the crowds. Experience a peaceful, authentic wildlife safari in the untamed wilderness and hidden corridors of Yala.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-24 bg-linear-to-t from-gray-50/50 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl">
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-6 bg-white rounded-3xl border border-gray-100 shadow-sm mb-12 sm:mb-16 text-center">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center justify-center p-2 sm:p-3">
              <span className="text-2xl sm:text-3xl font-black text-green-700 bg-linear-to-r from-green-700 to-emerald-600 bg-clip-text">
                {stat.value}
              </span>
              <span className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider mt-1 sm:mt-1.5">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 mb-12 sm:mb-20">
          
          <div className="group bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
            <div className="h-52 sm:h-64 overflow-hidden relative">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/6/65/Amur_Leopard_%28P.p._amurensis%29.jpg" 
                alt="Sri Lankan Leopard" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/45 via-transparent to-transparent"></div>
            </div>
            
            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
              <div>
                <div className="bg-green-50 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 -mt-12 sm:-mt-14 relative z-10 shadow-sm border border-green-100">
                  <MapPin className="text-green-600" size={24} />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-800 mb-3 sm:mb-4 group-hover:text-green-700 transition-colors">Yala Block 5 (Galge)</h2>
                <p className="text-gray-600 text-xs sm:text-sm mb-6 leading-relaxed">
                  Known for its scenic riverine forests and open grasslands, Block 5 is a haven for those looking to explore wildlife away from the heavy jeep traffic of Block 1. It offers an undisturbed environment to spot elusive leopards, sloth bears, and diverse birdlife.
                </p>
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
            <div className="h-52 sm:h-64 overflow-hidden relative">
              <img 
                src="https://c02.purpledshub.com/uploads/sites/62/2022/07/Asian-elephant-with-tusks-GettyImages-1357504051-aa5b0f9.jpg?webp=1&w=1200" 
                alt="Asian Elephant" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/45 via-transparent to-transparent"></div>
            </div>

            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
              <div>
                <div className="bg-blue-50 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 -mt-12 sm:-mt-14 relative z-10 shadow-sm border border-blue-100">
                  <Trees className="text-blue-600" size={24} />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-800 mb-3 sm:mb-4 group-hover:text-green-700 transition-colors">Yala Block 6 (Lunugamvehera)</h2>
                <p className="text-gray-600 text-xs sm:text-sm mb-6 leading-relaxed">
                  Functioning as a crucial elephant corridor, Lunugamvehera is a serene alternative to the main park. With its picturesque lakes and lush forests, it supports a high density of elephants and a thriving ecosystem of wetlands.
                </p>
              </div>
            </div>
          </div>

        </div>

        <div className="relative rounded-3xl p-6 sm:p-10 md:p-16 text-gray-800 shadow-sm overflow-hidden bg-white border border-gray-100">
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=1500')] bg-cover bg-center"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3 sm:mb-4 text-gray-800">Why Book With GuideLanka?</h2>
              <p className="text-gray-500 max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed">
                Our platform is specifically designed to promote ethical wildlife tourism and provide you with the best possible wilderness experience in Sri Lanka.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="bg-gray-50/50 hover:bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-md transition duration-300">
                <div className="bg-green-50 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 border border-green-100">
                  <Shield className="text-green-600" size={24} />
                </div>
                <h3 className="font-extrabold text-base sm:text-lg mb-2 sm:mb-3 text-gray-800">Ethical Safari Tracking</h3>
                <p className="text-xs text-gray-600 leading-relaxed">By routing safaris to Block 5 & 6, we help reduce overcrowding in Block 1, minimizing stress on the animals and protecting the ecosystem.</p>
              </div>
              
              <div className="bg-gray-50/50 hover:bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-md transition duration-300">
                <div className="bg-green-50 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 border border-green-100">
                  <Compass className="text-green-600" size={24} />
                </div>
                <h3 className="font-extrabold text-base sm:text-lg mb-2 sm:mb-3 text-gray-800">Smart S2R Technology</h3>
                <p className="text-xs text-gray-600 leading-relaxed">Our Sighting-to-Route system helps drivers navigate the complex tracks of Block 5 & 6 efficiently while ensuring your safety and spotting chances.</p>
              </div>
              
              <div className="bg-gray-50/50 hover:bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-md transition duration-300">
                <div className="bg-green-50 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 border border-green-100">
                  <Camera className="text-green-600" size={24} />
                </div>
                <h3 className="font-extrabold text-base sm:text-lg mb-2 sm:mb-3 text-gray-800">Exclusive Guides</h3>
                <p className="text-xs text-gray-600 leading-relaxed">Connect with top-rated drivers who specialize in these remote zones for uninterrupted photography, birding, and serene safari loops.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-12 border border-gray-100 shadow-sm mt-12 sm:mt-16">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-800">Park Entrance Fees</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-xs sm:text-sm mt-2 leading-relaxed">
              Official Department of Wildlife Conservation (DWC) permit rates for entering Yala and Lunugamvehera National Parks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
            <div className="bg-gray-50/50 rounded-2xl p-5 sm:p-6 border border-gray-100 flex flex-col justify-between hover:shadow-md transition duration-300">
              <div>
                <div className="bg-green-50 w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-green-700 mb-4 border border-green-100">
                  <Globe size={22} />
                </div>
                <h3 className="font-extrabold text-base sm:text-lg text-gray-800 mb-3">Foreign Tourists</h3>
                <ul className="space-y-2.5 text-xs sm:text-sm text-gray-600">
                  <li className="flex justify-between">
                    <span>Adult:</span>
                    <span className="font-bold text-gray-800">USD ~45 (LKR 14,000)</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Child (6-12 yrs):</span>
                    <span className="font-bold text-gray-800">USD ~22.5 (LKR 7,000)</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Under 6:</span>
                    <span className="text-emerald-600 font-extrabold">Free Entry</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-50/50 rounded-2xl p-5 sm:p-6 border border-gray-100 flex flex-col justify-between hover:shadow-md transition duration-300">
              <div>
                <div className="bg-blue-50 w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-blue-700 mb-4 border border-blue-100">
                  <Coins size={22} />
                </div>
                <h3 className="font-extrabold text-base sm:text-lg text-gray-800 mb-3">SAARC Nationals</h3>
                <ul className="space-y-2.5 text-xs sm:text-sm text-gray-600">
                  <li className="flex justify-between">
                    <span>Adult:</span>
                    <span className="font-bold text-gray-800">USD ~30 (LKR 9,300)</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Child (6-12 yrs):</span>
                    <span className="font-bold text-gray-800">USD ~15 (LKR 4,650)</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Under 6:</span>
                    <span className="text-emerald-600 font-extrabold">Free Entry</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-50/50 rounded-2xl p-5 sm:p-6 border border-gray-100 flex flex-col justify-between hover:shadow-md transition duration-300">
              <div>
                <div className="bg-emerald-50 w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-emerald-700 mb-4 border border-emerald-100">
                  <span className="text-xl font-bold">🇱🇰</span>
                </div>
                <h3 className="font-extrabold text-base sm:text-lg text-gray-800 mb-3">Sri Lankan Residents</h3>
                <ul className="space-y-2.5 text-xs sm:text-sm text-gray-600">
                  <li className="flex justify-between">
                    <span>Adult:</span>
                    <span className="font-bold text-gray-800">LKR 250</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Child (6-12 yrs):</span>
                    <span className="font-bold text-gray-800">LKR 100</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Under 6:</span>
                    <span className="text-emerald-600 font-extrabold">Free Entry</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
