import { Star, MessageSquare, Car } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DriverCard({ driver }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition duration-300">

      <div className="flex items-center space-x-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden shadow-sm">
          <img src={driver.image} alt={driver.name} className="w-full h-full object-cover" />
        </div>

        <div>
          <h3 className="font-bold text-lg text-gray-900">{driver.name}</h3>
          <div className="flex items-center text-yellow-500 text-sm mt-1">
            <Star size={16} fill="currentColor" />
            <span className="ml-1 font-bold text-gray-700">{driver.rating}</span>
            <span className="ml-1 text-gray-400">({driver.reviews} reviews)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-gray-600 text-xs mb-4">
        <div className="flex items-center bg-gray-50 p-2.5 rounded-lg border border-gray-100">
          <Car size={16} className="mr-2 text-green-600 shrink-0" />
          <span className="font-bold text-gray-700 truncate">{driver.vehicle}</span>
        </div>
        <div className="flex items-center bg-gray-50 p-2.5 rounded-lg border border-gray-100">
          <span className="mr-2 text-yellow-650 text-sm shrink-0">🪙</span>
          <span className="font-bold text-gray-700">LKR 12,500</span>
        </div>
      </div>
      <div className="text-[10px] text-gray-400 font-bold text-center uppercase tracking-wider mb-6">
        *Excludes Park Entrance Tickets
      </div>

      <div className="flex space-x-3">
        <Link to={`/driver/${driver.id}`} className="flex-1 bg-green-50 text-green-700 text-center py-2.5 rounded-xl font-bold hover:bg-green-100 transition flex items-center justify-center">
          <MessageSquare size={16} className="mr-2" />
          Reviews
        </Link>

        <Link to="/booking" className="flex-1 bg-[#024C25] text-white text-center py-2.5 rounded-xl font-bold hover:bg-[#01381b] transition shadow-md">
          Book Now
        </Link>
      </div>

    </div>
  );
}
