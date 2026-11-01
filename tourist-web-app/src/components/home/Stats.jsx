import { useState, useEffect } from 'react';
import { Users, Map, Compass, Shield } from 'lucide-react';

function AnimatedCounter({ target, suffix = '', duration = 1500, isDecimal = false }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      let currentValue = progress * target;
      if (isDecimal) {
        setCount(parseFloat(currentValue.toFixed(1)));
      } else {
        setCount(Math.floor(currentValue));
      }

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [target, duration, isDecimal]);

  return (
    <span>
      {isDecimal ? count.toFixed(1) : count.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function Stats() {
  const stats = [
    {
      icon: <Users className="text-green-600" size={24} />,
      target: 1240,
      suffix: "+",
      label: "Safaris Booked"
    },
    {
      icon: <Map className="text-green-600" size={24} />,
      target: 4820,
      suffix: "+",
      label: "Sighting Reports"
    },
    {
      icon: <Compass className="text-green-600" size={24} />,
      target: 120,
      suffix: "+",
      label: "Verified Drivers"
    },
    {
      icon: <Shield className="text-green-600" size={24} />,
      target: 99.9,
      suffix: "%",
      isDecimal: true,
      label: "Safety Record"
    }
  ];

  return (
    <section className="relative -mt-12 sm:-mt-16 z-20 container mx-auto px-4 max-w-6xl">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 md:gap-6 bg-white p-4 sm:p-6 md:p-8 rounded-3xl border border-gray-100 shadow-xl">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className={`flex flex-col items-center text-center p-2 sm:p-4 space-y-1.5 sm:space-y-2 ${
              idx % 2 === 0 ? 'border-r border-gray-100' : 'md:border-r border-gray-100'
            } ${idx < 2 ? 'border-b md:border-b-0 pb-4 md:pb-0' : 'pt-2 md:pt-0'} ${
              idx === 3 ? 'md:border-r-0' : ''
            }`}
          >
            <div className="p-2.5 sm:p-3 bg-green-500/10 rounded-2xl">
              {stat.icon}
            </div>
            <span className="text-xl sm:text-2xl md:text-3xl font-black text-gray-800 tracking-tight">
              <AnimatedCounter
                target={stat.target}
                suffix={stat.suffix}
                isDecimal={stat.isDecimal}
              />
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
