import { useState } from 'react';
import {
  Camera,
  Search,
  Filter,
  X
} from 'lucide-react';
import heroBg from '../assets/background.jpg';
import elephantShowcaseImg from '../assets/Majestic Sri Lankan Elephant.jpg';
import leopardShowcaseImg from '../assets/Leopard in the Scrublands.jpg';
import jeepShowcaseImg from '../assets/Jeep Safari Adventure.jpg';
import peafowlShowcaseImg from '../assets/Dancing Blue Peafowl.jpg';
import beachShowcaseImg from '../assets/Patanangala Beach Coastline.jpg';
import deerShowcaseImg from '../assets/Grasslands Spotted Deer.jpg';

const SHOWCASE_PHOTOS = [
  {
    id: 's1',
    title: 'Majestic Sri Lankan Elephant',
    category: 'Wildlife',
    tag: 'Elephant',
    image: elephantShowcaseImg,
    description: 'An adult male elephant wading through the waters of a lake during the golden hour in Yala National Park.'
  },
  {
    id: 's2',
    title: 'Leopard in the Scrublands',
    category: 'Wildlife',
    tag: 'Leopard',
    image: leopardShowcaseImg,
    description: 'A Sri Lankan Leopard stealthily traversing dry forest paths. Yala is renowned for having one of the highest leopard densities in the world.'
  },
  {
    id: 's3',
    title: 'Jeep Safari Adventure',
    category: 'Safari Life',
    tag: 'Safari',
    image: jeepShowcaseImg,
    description: 'Custom-built safari jeeps trekking on red-dirt tracks, surrounded by dense dry woodlands and active wildlife.'
  },
  {
    id: 's4',
    title: 'Dancing Blue Peafowl',
    category: 'Wildlife',
    tag: 'Peacock',
    image: peafowlShowcaseImg,
    description: 'A male Indian Peacock displaying its vibrant, iridescent blue-green train feathers to attract attention.'
  },
  {
    id: 's5',
    title: 'Patanangala Beach Coastline',
    category: 'Landscapes',
    tag: 'Scenic',
    image: beachShowcaseImg,
    description: 'Where the wilderness meets the Indian Ocean. The scenic coastline and dramatic rock formations at Patanangala, Yala.'
  },
  {
    id: 's6',
    title: 'Grasslands Spotted Deer',
    category: 'Wildlife',
    tag: 'Deer',
    image: deerShowcaseImg,
    description: 'A peaceful herd of axis deer (spotted deer) grazing in the wide savannah plains during the early morning hours.'
  }
];

export default function Gallery() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showcaseCategory, setShowcaseCategory] = useState('All');

  const showcaseCategories = ['All', 'Wildlife', 'Landscapes', 'Safari Life'];

  const filteredShowcase = SHOWCASE_PHOTOS.filter(photo => {
    const matchesSearch = (photo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          photo.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = showcaseCategory === 'All' || photo.category === showcaseCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="pt-24 pb-16 min-h-screen bg-gray-50/50 font-sans">

      <div 
        className="relative w-full h-70 sm:h-85 md:h-100 overflow-hidden bg-cover bg-center mb-8 sm:mb-12 shadow-md"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-linear-to-t from-gray-950 via-gray-900/50 to-black/30 flex flex-col items-center justify-center p-4 sm:p-6 text-center z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/30 mb-3 sm:mb-4 backdrop-blur-md animate-pulse">
            <Camera size={14} className="text-green-400" />
            <span>OFFICIAL YALA GALLERY</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-2 sm:mb-4 tracking-tight leading-tight">
            Yala Photo Showcase
          </h1>
          <p className="text-gray-200 text-xs sm:text-base md:text-lg max-w-xl font-medium leading-relaxed px-2">
            Explore a curated collection of high-definition wildlife, scenic landscapes, and safari moments captured across Yala National Park.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-24 bg-linear-to-t from-gray-50/50 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl space-y-8">

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">

          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <input
              type="text"
              placeholder="Search photo showcase..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-55 bg-gray-50 border border-gray-300 text-sm font-semibold text-gray-700 placeholder-gray-400 rounded-2xl focus:border-green-600 focus:outline-none transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-650"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
            <div className="flex items-center text-xs font-black text-gray-400 uppercase tracking-wider mr-2 shrink-0">
              <Filter size={14} className="mr-1" /> Categories:
            </div>
            {showcaseCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setShowcaseCategory(cat)}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold tracking-wide border transition shrink-0 cursor-pointer ${
                  showcaseCategory === cat
                    ? 'bg-[#024C25] text-white border-[#024C25] shadow-xs'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>

        {filteredShowcase.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center space-y-4">
            <h3 className="text-xl font-bold text-gray-800">No Showcase Photos Found</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              No Yala photos match your search terms or category selection.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredShowcase.map((photo) => (
              <div
                key={photo.id}
                className="group bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 flex flex-col"
              >
                <div className="relative h-64 overflow-hidden bg-gray-200">
                  <img
                    src={photo.image}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    loading="lazy"
                  />

                  <span className="absolute top-4 left-4 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border border-white/20 bg-green-900/85 backdrop-blur-md text-white shadow-xs">
                    {photo.category}
                  </span>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-black text-gray-800 mb-2 group-hover:text-green-700 transition-colors">
                      {photo.title}
                    </h3>
                    <p className="text-gray-500 text-xs leading-relaxed font-semibold">
                      {photo.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}
