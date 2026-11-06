import { useState } from 'react';
import {
  AlertTriangle,
  Trash2,
  CameraOff,
  VolumeX,
  ShieldAlert,
  PhoneCall,
  Info,
  Search,
  Check,
  XCircle,
  X,
  ChevronRight,
  Award,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Compass,
  HeartHandshake
} from 'lucide-react';
import heroBg from '../assets/background.jpg';
import noFlashImg from '../assets/No Flash Photography.png';
import keepSilenceImg from '../assets/Keep Silence.png';
import noLitteringImg from '../assets/No Littering & Plastics.png';
import stayInsideImg from '../assets/Stay Inside the Vehicle.png';
import followGuideImg from '../assets/Follow the Guide.png';

export default function ParkRules() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [spottingTab, setSpottingTab] = useState('elephants');

  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const categories = [
    { id: 'all', label: 'All Guidelines' },
    { id: 'wildlife', label: 'Wildlife Protection' },
    { id: 'safety', label: 'Visitor Safety' },
    { id: 'environment', label: 'Eco Conservation' }
  ];

  const rules = [
    {
      category: "wildlife",
      badge: "Wildlife Protection",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-150",
      image: noFlashImg,
      icon: <CameraOff size={20} />,
      title: "No Flash Photography",
      desc: "Do not use flash when taking photos as it startles, blinds, and severely disturbs wild animals in their natural habitats."
    },
    {
      category: "wildlife",
      badge: "Wildlife Protection",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-100",
      image: keepSilenceImg,
      icon: <VolumeX size={20} />,
      title: "Keep Silence",
      desc: "Maintain absolute silence during the safari tracks. Loud noises stress the wildlife and prevent you from hearing bird calls and alarms."
    },
    {
      category: "environment",
      badge: "Eco Conservation",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-100",
      image: noLitteringImg,
      icon: <Trash2 size={20} />,
      title: "No Littering & Plastics",
      desc: "Keep the national park pristine. Bring back all your waste, wrappers, and plastic containers. Never feed or throw waste to animals."
    },
    {
      category: "safety",
      badge: "Critical Safety",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-100",
      image: stayInsideImg,
      icon: <AlertTriangle size={20} />,
      title: "Stay Inside the Vehicle",
      desc: "For your ultimate safety, never step out, stand on seats, or lean out of the safari vehicle under any circumstances during the ride."
    },
    {
      category: "safety",
      badge: "Critical Safety",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-100",
      image: followGuideImg,
      icon: <ShieldAlert size={20} />,
      title: "Follow the Guide",
      desc: "Always respect and follow the strict instructions given by your registered safari driver and park rangers. They know the wild best."
    }
  ];

  const dos = [
    "Wear earthy, neutral colors (khaki, olive, brown) to blend in.",
    "Always keep a safe distance of at least 30 meters from wild animals.",
    "Listen to your driver and follow ranger instructions at all times.",
    "Bring binoculars and high-zoom cameras for safe observation.",
    "Bring water in reusable bottles; avoid single-use plastics."
  ];

  const donts = [
    "Do not feed, provoke, or try to get the attention of any animal.",
    "Do not litter or leave behind any food waste or packaging.",
    "Do not use flash photography, drones, or laser pointers.",
    "Do not smoke, light fires, or bring alcohol into the park.",
    "Do not step out of the safari vehicle except at designated spots."
  ];

  const wildlifeGuides = {
    elephants: {
      title: "Wild Elephant Conduct",
      tips: [
        "Always give wild elephants the absolute right of way on paths.",
        "Keep engines on idle or turn them off completely if an elephant approaches close.",
        "Never rev engines or honk horns to clear elephants off the track.",
        "Do not block an elephant family's path of retreat or movement."
      ]
    },
    leopards: {
      title: "Leopard Sightings",
      tips: [
        "Keep vehicles at a respectful distance to avoid crowding the animal.",
        "Maintain absolute silence; leopards are extremely sound-sensitive.",
        "Never attempt to follow a leopard if it moves away into the bush.",
        "Turn off engines to allow everyone to observe without vibration."
      ]
    },
    birds: {
      title: "Birds & Nesting",
      tips: [
        "Do not approach nesting sites or disturb breeding bird pairs.",
        "Avoid using birdcall playback apps as it confuses and stresses nesting birds.",
        "Keep camera flash off at all times; it can blind nocturnal birds.",
        "Use long telephoto lenses to observe birds without approaching."
      ]
    }
  };

  const quizQuestions = [
    {
      id: 1,
      question: "You see a leopard sleeping on a tree branch near the safari path. What should you do?",
      options: [
        { text: "Shout or clap to get its attention so it looks at your camera.", correct: false },
        { text: "Turn off your camera flash, maintain absolute silence, and observe quietly.", correct: true },
        { text: "Ask your driver to move off-track and drive closer to the tree.", correct: false }
      ],
      explanation: "Flash photography and loud noises stress leopards. Going off-track destroys natural habitats and violates park regulations."
    },
    {
      id: 2,
      question: "A beautiful hornbill bird is nesting on a low bush right next to the track. What is the correct action?",
      options: [
        { text: "Remain inside the vehicle, do not lean out, and use your camera zoom.", correct: true },
        { text: "Quickly step out of the jeep for 5 seconds to get a closer shot.", correct: false },
        { text: "Toss a small piece of fruit towards it to see if it will feed.", correct: false }
      ],
      explanation: "Stepping out of the vehicle is extremely dangerous and strictly prohibited. Feeding wild animals makes them dependent and disrupts their natural diet."
    },
    {
      id: 3,
      question: "What is the best way to handle your food wrappers and plastic water bottles during the safari?",
      options: [
        { text: "Leave them under the seat of the safari jeep.", correct: false },
        { text: "Store them securely in your bag and dispose of them outside the national park.", correct: true },
        { text: "Toss them in the park's trash bins at the main gate.", correct: false }
      ],
      explanation: "Littering inside national parks poses severe threats to wildlife who may ingest plastics. Taking your waste out of the park is the most eco-friendly practice."
    }
  ];

  const filteredRules = rules.filter(rule => {
    const matchesCategory = activeCategory === 'all' || rule.category === activeCategory;
    const matchesSearch = rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          rule.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAnswerSelection = (optionIdx) => {
    if (showExplanation) return;
    setSelectedOptionIdx(optionIdx);
    setShowExplanation(true);
    if (quizQuestions[currentQuestionIdx].options[optionIdx].correct) {
      setQuizScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOptionIdx(null);
    setShowExplanation(false);
    if (currentQuestionIdx < quizQuestions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleResetQuiz = () => {
    setQuizStarted(false);
    setCurrentQuestionIdx(0);
    setSelectedOptionIdx(null);
    setQuizScore(0);
    setQuizCompleted(false);
    setShowExplanation(false);
  };

  return (
    <div className="pt-24 pb-16 min-h-screen bg-gray-50/50 font-sans">

      <div className="relative w-full h-70 sm:h-85 md:h-100 overflow-hidden bg-cover bg-center mb-8 sm:mb-12 shadow-md"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-linear-to-t from-gray-950 via-gray-900/50 to-black/30 flex flex-col items-center justify-center p-4 sm:p-6 text-center z-10">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-2 sm:mb-4 tracking-tight leading-tight">Park Guidelines</h1>
          <p className="text-gray-200 text-xs sm:text-base md:text-lg max-w-xl font-medium leading-relaxed px-2">
            Help us protect the wilderness. Observe these mandatory safety policies for an ethical, respectful, and safe safari experience.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-24 bg-linear-to-t from-gray-50/50 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-10 sm:mb-16">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm hover:shadow-md transition duration-300 flex flex-col">
            <div className="flex items-center gap-3.5 mb-6">
              <div className="p-2.5 sm:p-3 bg-emerald-50 text-emerald-650 rounded-2xl border border-emerald-100">
                <ThumbsUp size={22} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-800">What You Should Do</h2>
              </div>
            </div>
            <ul className="space-y-3 sm:space-y-4 flex-1">
              {dos.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="mt-1 bg-emerald-50 text-emerald-600 rounded-full p-0.5 shrink-0">
                    <Check size={14} className="stroke-3" />
                  </div>
                  <span className="text-gray-600 text-xs sm:text-sm font-semibold leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-sm hover:shadow-md transition duration-300 flex flex-col">
            <div className="flex items-center gap-3.5 mb-6">
              <div className="p-2.5 sm:p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
                <ThumbsDown size={22} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-800">What You Must Avoid</h2>
              </div>
            </div>
            <ul className="space-y-3 sm:space-y-4 flex-1">
              {donts.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="mt-1 bg-rose-50 text-rose-650 rounded-full p-0.5 shrink-0">
                    <X size={12} className="stroke-3" />
                  </div>
                  <span className="text-gray-600 text-xs sm:text-sm font-semibold leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 md:p-8 mb-8 sm:mb-10 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">

            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs transition-all duration-200 border cursor-pointer ${
                    activeCategory === category.id
                      ? 'bg-[#024C25] text-white border-[#024C25] shadow-sm'
                      : 'bg-white text-gray-500 border-gray-250 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>

            <div className="relative max-w-full md:max-w-sm w-full">
              <Search className="absolute left-3.5 top-3 text-gray-400" size={17} />
              <input
                type="text"
                placeholder="Search park rules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 pl-10 pr-4 py-2.5 rounded-2xl text-xs font-semibold focus:outline-hidden focus:border-green-700 focus:bg-white transition duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  <X size={15} />
                </button>
              )}
            </div>

          </div>
        </div>

        {filteredRules.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
            {filteredRules.map((rule, index) => (
              <div
                key={index}
                className="group bg-white rounded-3xl shadow-sm hover:shadow-xl border border-gray-100 hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col"
              >
                <div className="h-48 sm:h-56 overflow-hidden relative">
                  <img
                    src={rule.image}
                    alt={rule.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-black border backdrop-blur-md shadow-sm ${rule.badgeColor}`}>
                      {rule.badge}
                    </span>
                  </div>

                  <div className="absolute bottom-4 right-4 bg-white p-3.5 rounded-2xl shadow-md text-green-700 border border-gray-50">
                    {rule.icon}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-extrabold text-gray-800 mb-3 group-hover:text-green-700 transition-colors">
                      {rule.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {rule.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center shadow-sm mb-16">
            <Search className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-800 mb-1">No matching rules found</h3>
            <p className="text-gray-400 text-xs">Try refining your search keyword or switching categories.</p>
          </div>
        )}
      </div>
    </div>
  );
}
