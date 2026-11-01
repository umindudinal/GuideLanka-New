import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="pt-28 pb-16 min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-100 text-center flex flex-col items-center">
        <div className="w-20 h-20 bg-green-50 text-green-700 rounded-3xl flex items-center justify-center mb-6 border border-green-100 shadow-sm">
          <Compass size={40} className="animate-spin" style={{ animationDuration: '10s' }} />
        </div>
        <span className="text-xs font-black text-green-700 bg-green-50 px-3 py-1 rounded-full uppercase tracking-wider mb-2 border border-green-200">
          404 Error
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-800 mb-3">
          Page Lost in the Wild
        </h1>
        <p className="text-gray-500 text-xs sm:text-sm mb-8 leading-relaxed">
          The safari trail you are looking for does not exist or has been relocated deeper into Yala National Park.
        </p>
        <Link
          to="/"
          className="w-full bg-[#024C25] hover:bg-[#01381b] text-white font-bold py-3.5 rounded-2xl text-sm transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          <ArrowLeft size={16} />
          Return to Safari Home
        </Link>
      </div>
    </div>
  );
}
