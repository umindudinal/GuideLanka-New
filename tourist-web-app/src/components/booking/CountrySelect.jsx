import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Globe } from 'lucide-react';
import { 
  POPULAR_COUNTRIES, 
  ALL_COUNTRIES, 
  getCountryClassification, 
  getCountryFlagUrl,
  getCountryFlagEmoji
} from '../../data/countries';

export default function CountrySelect({ value, onChange, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Auto-focus search input
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
      setSearchTerm('');
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedCountryObj = ALL_COUNTRIES.find(c => c.code === value) || {
    code: value,
    name: 'Select Country'
  };

  const selectedInfo = getCountryClassification(value);

  // Filter countries by search term
  const filteredAll = ALL_COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPopular = POPULAR_COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (code) => {
    onChange(code);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full pl-3 pr-4 py-3 sm:py-3.5 bg-gray-50 hover:bg-gray-100/70 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 focus:bg-white text-sm font-medium text-gray-700 transition flex items-center justify-between gap-2 text-left cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-3xs"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-4.5 rounded overflow-hidden shrink-0 shadow-2xs border border-gray-200 bg-white flex items-center justify-center">
            {value ? (
              <img
                src={getCountryFlagUrl(value)}
                alt={selectedCountryObj.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'inline';
                }}
              />
            ) : (
              <Globe size={14} className="text-gray-400" />
            )}
            <span style={{ display: 'none' }} className="text-xs">
              {getCountryFlagEmoji(value)}
            </span>
          </div>

          <span className="font-bold text-gray-800 truncate">
            {selectedCountryObj.name}
          </span>

          {value && (
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 ${
              selectedInfo.type === 'local'
                ? 'bg-emerald-100 text-emerald-800'
                : selectedInfo.type === 'saarc'
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-blue-100 text-blue-900'
            }`}>
              {selectedInfo.badge}
            </span>
          )}
        </div>

        <ChevronDown 
          size={18} 
          className={`text-gray-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-green-700' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200/90 z-999 overflow-hidden"
          style={{ animation: 'dropIn 0.18s ease-out' }}
        >
          <style>{`
            @keyframes dropIn {
              from { opacity: 0; transform: translateY(-6px) scale(0.98); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>

          {/* Search Box */}
          <div className="p-2.5 border-b border-gray-100 bg-gray-50/80 sticky top-0 z-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={15} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search country name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
              />
            </div>
          </div>

          {/* Country List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-gray-50 p-1">
            {searchTerm === '' && filteredPopular.length > 0 && (
              <div className="pb-1 mb-1 border-b border-gray-100">
                <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-gray-400 bg-gray-50/60 rounded-md">
                  Popular Nationalities
                </div>
                {filteredPopular.map((c) => {
                  const info = getCountryClassification(c.code);
                  const isSelected = value === c.code;
                  return (
                    <button
                      key={`pop-${c.code}`}
                      type="button"
                      onClick={() => handleSelect(c.code)}
                      className={`w-full px-3 py-2 rounded-xl flex items-center justify-between gap-2 text-left transition cursor-pointer text-xs ${
                        isSelected 
                          ? 'bg-green-50/90 text-green-900 font-bold' 
                          : 'hover:bg-gray-100/70 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-5 h-3.5 rounded overflow-hidden shrink-0 shadow-3xs border border-gray-200 bg-white flex items-center justify-center">
                          <img
                            src={getCountryFlagUrl(c.code)}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) e.target.nextSibling.style.display = 'inline';
                            }}
                          />
                          <span style={{ display: 'none' }} className="text-[11px]">
                            {getCountryFlagEmoji(c.code)}
                          </span>
                        </div>
                        <span className="truncate">{c.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                          info.type === 'local'
                            ? 'bg-emerald-100 text-emerald-800'
                            : info.type === 'saarc'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-blue-100 text-blue-900'
                        }`}>
                          {info.badge}
                        </span>
                        {isSelected && <Check size={14} className="text-green-600" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* All countries section */}
            <div>
              {searchTerm === '' && (
                <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-gray-400 bg-gray-50/60 rounded-md">
                  All Countries (A - Z)
                </div>
              )}

              {filteredAll.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400">
                  No countries match &quot;{searchTerm}&quot;
                </div>
              ) : (
                filteredAll.map((c) => {
                  const info = getCountryClassification(c.code);
                  const isSelected = value === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleSelect(c.code)}
                      className={`w-full px-3 py-2 rounded-xl flex items-center justify-between gap-2 text-left transition cursor-pointer text-xs ${
                        isSelected 
                          ? 'bg-green-50/90 text-green-900 font-bold' 
                          : 'hover:bg-gray-100/70 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-5 h-3.5 rounded overflow-hidden shrink-0 shadow-3xs border border-gray-200 bg-white flex items-center justify-center">
                          <img
                            src={getCountryFlagUrl(c.code)}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) e.target.nextSibling.style.display = 'inline';
                            }}
                          />
                          <span style={{ display: 'none' }} className="text-[11px]">
                            {getCountryFlagEmoji(c.code)}
                          </span>
                        </div>
                        <span className="truncate">{c.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                          info.type === 'local'
                            ? 'bg-emerald-100 text-emerald-800'
                            : info.type === 'saarc'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-blue-100 text-blue-900'
                        }`}>
                          {info.badge}
                        </span>
                        {isSelected && <Check size={14} className="text-green-600" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

