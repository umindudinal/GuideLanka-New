import { Camera, Calendar, Map } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroBg from '../../assets/background.jpg';

export default function Hero() {
  return (
    <div className="relative pt-28 md:pt-20 pb-24 md:pb-32 flex content-center items-center justify-center min-h-[90vh] md:min-h-screen">
      <div
        className="absolute top-0 w-full h-full bg-center bg-cover bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <span className="w-full h-full absolute bg-linear-to-b from-black/80 via-black/55 to-green-950/50"></span>
      </div>

      <div className="container relative mx-auto px-4 z-10">
        <div className="items-center flex flex-wrap justify-center">
          <div className="w-full lg:w-9/12 px-2 sm:px-4 text-center">

            <div className="inline-flex items-center px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-green-300 mb-4 sm:mb-6 mt-4 sm:mt-8 md:mt-12 shadow-inner">
              <Camera size={14} className="mr-2 animate-pulse" />
              <span className="text-[11px] sm:text-xs font-bold tracking-wider uppercase">Welcome to the Wild</span>
            </div>

            <h1 className="text-white font-black text-3xl sm:text-5xl md:text-7xl drop-shadow-md mb-4 sm:mb-6 leading-tight tracking-tight">
              Discover the Untamed <br />
              <span className="bg-linear-to-r from-green-400 via-emerald-300 to-green-300 bg-clip-text text-transparent">Beauty of Sri Lanka</span>
            </h1>

            <p className="mt-2 sm:mt-4 text-sm sm:text-lg md:text-xl text-gray-200 drop-shadow-sm mb-8 sm:mb-10 max-w-2xl mx-auto font-medium leading-relaxed px-2">
              Book verified safari vehicles, track sightings in real-time, and explore nature responsibly in Yala Block 5 & 6.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-6 w-full max-w-md sm:max-w-none mx-auto">
              <Link
                to="/booking"
                className="w-full sm:w-auto bg-[#024C25] hover:bg-[#01381b] text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base transition-all shadow-md hover:shadow-lg transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Calendar size={18} />
                Plan Your Safari
              </Link>
              {/* <Link
                to="/map"
                className="w-full sm:w-auto bg-white/10 hover:bg-white/15 text-white border border-white/20 px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base transition-all backdrop-blur-sm flex items-center justify-center gap-2 transform active:scale-95"
              >
                <Map size={18} className="text-green-400" />
                Live Safari Map
              </Link> */}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
