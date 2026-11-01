import { useState } from 'react';
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  MessageCircle, 
  ArrowRight 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import heroBg from '../assets/background.jpg';

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const categories = [
    { id: 'all', label: 'All Questions' },
    { id: 'booking', label: 'Bookings & Safaris' },
    { id: 'tracking', label: 'Live Tracking' },
    { id: 'rules', label: 'Park Guidelines' }
  ];

  const faqs = [
    {
      category: 'booking',
      question: 'How do I book a safari vehicle on GuideLanka?',
      answer: 'You can browse verified safari guides in the "Drivers" page, select a guide based on real reviews and wildlife sightings, and reserve your date and slot directly through our booking portal.'
    },
    {
      category: 'tracking',
      question: 'How does live safari tracking work?',
      answer: 'Once you book a verified safari vehicle and log into your tourist account, you will be able to view the real-time GPS location of your safari jeep on the "Live Safari Map" during your safari tour.'
    },
    {
      category: 'tracking',
      question: 'Are animal sightings updated in real-time?',
      answer: 'Yes! Safari drivers inside Yala National Park use the GuideLanka mobile app to report wildlife sightings (such as leopards, elephants, or sloth bears) immediately. These sightings are verified and displayed on the interactive map for visitors.'
    },
    {
      category: 'rules',
      question: 'Can I step out of the safari vehicle during the tour?',
      answer: 'No, stepping out of the vehicle is strictly prohibited for your safety and wildlife protection. Visitors must stay inside the safari jeep at all times unless at designated, ranger-approved resting points (e.g. Patanangala beach).'
    },
    {
      category: 'rules',
      question: 'Is flash photography allowed inside the national park?',
      answer: 'Flash photography is strictly prohibited inside Yala National Park. Bright flashes blind, startle, and cause severe distress to wild animals. Please disable your camera flash before entering the park.'
    },
    {
      category: 'booking',
      question: 'What is included in the safari vehicle booking price?',
      answer: 'The safari booking price covers the private jeep rental, fuel, and the services of the licensed driver-guide. National Park entrance tickets and government service charges are paid separately at the park entrance gate counter.'
    }
  ];

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const filteredFaqs = activeTab === 'all'
    ? faqs
    : faqs.filter(faq => faq.category === activeTab);

  return (
    <div className="pt-24 pb-16 min-h-screen bg-gray-50/50 font-sans">

      {/* Signature Full-width Hero Banner */}
      <div 
        className="relative w-full h-70 sm:h-85 md:h-100 overflow-hidden bg-cover bg-center mb-8 sm:mb-12 shadow-md"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-linear-to-t from-gray-950 via-gray-900/50 to-black/30 flex flex-col items-center justify-center p-4 sm:p-6 text-center z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/30 mb-3 sm:mb-4 backdrop-blur-md animate-pulse">
            <HelpCircle size={14} className="text-green-400" />
            <span>KNOWLEDGE BASE & SUPPORT</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-2 sm:mb-4 tracking-tight leading-tight">
            FAQ & Help Center
          </h1>
          <p className="text-gray-200 text-xs sm:text-base md:text-lg max-w-xl font-medium leading-relaxed px-2">
            Find quick answers to common questions about safari bookings, wildlife sightings, park permits, and regulations.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-24 bg-linear-to-t from-gray-50/50 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 max-w-3xl space-y-6 sm:space-y-8">

        {/* Category Filter Pills */}
        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-4 sm:mb-6">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => {
                setActiveTab(category.id);
                setOpenIndex(null);
              }}
              className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-all duration-200 border cursor-pointer ${
                activeTab === category.id
                  ? 'bg-[#024C25] text-white border-[#024C25] shadow-md shadow-[#024C25]/20'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3 sm:space-y-4">
          {filteredFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-xs hover:shadow-md transition duration-200"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-4 sm:px-6 py-4 sm:py-5 text-left flex items-center justify-between gap-3 sm:gap-4 font-black text-gray-800 hover:text-green-700 transition cursor-pointer"
                >
                  <span className="text-sm sm:text-base md:text-lg leading-snug">{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp className="text-green-600 shrink-0" size={18} />
                  ) : (
                    <ChevronDown className="text-gray-400 shrink-0" size={18} />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-1 border-t border-gray-100 text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed bg-gray-50/40">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still have questions card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs text-center space-y-4 mt-8 sm:mt-12">
          <div className="w-12 h-12 bg-green-50 text-green-700 rounded-2xl flex items-center justify-center mx-auto border border-green-100 shadow-3xs">
            <Info size={22} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-black text-gray-900">Still have questions?</h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
              If you need customized assistance or have specific inquiries about your safari, reach out to our team directly.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-[#024C25] hover:bg-[#01381b] text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl transition shadow-md active:scale-95 cursor-pointer"
            >
              Contact Support Desk <ArrowRight size={15} />
            </Link>
            <a
              href="https://wa.me/94771234567"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl transition shadow-md active:scale-95 cursor-pointer"
            >
              <MessageCircle size={16} /> WhatsApp (+94 77 123 4567)
            </a>
          </div>
        </div>

      </div>

    </div>
  );
}
