import logoImg from '../../assets/logo.png';
import { X, CheckCircle2 } from 'lucide-react';
import GoogleBtn from './GoogleBtn';

export default function LoginModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300" onClick={onClose}></div>

      <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl z-10 overflow-hidden transform transition-all duration-300 border border-gray-150 flex flex-col">

        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-white/80 hover:text-white hover:bg-white/10 transition bg-black/20 rounded-full p-2 z-20 cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="relative bg-linear-to-br from-green-800 via-emerald-800 to-green-950 px-8 pt-10 pb-8 text-white text-center select-none overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-size-[20px_20px] mix-blend-overlay"></div>

          <div className="relative z-10 flex flex-col items-center gap-2.5">
            <div className="w-16 h-16 p-2 bg-white rounded-2xl shadow-xl shadow-black/25 flex items-center justify-center border-2 border-white/80 ring-4 ring-white/10">
              <img src={logoImg} alt="GuideLanka" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">GuideLanka</h2>
              <p className="text-green-200/80 text-xs font-semibold uppercase tracking-wider mt-1">Responsible Wildlife Tourism</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="space-y-6 flex flex-col">

            <div className="bg-green-50/50 rounded-2xl p-4.5 border border-green-100/70">
              <h3 className="font-extrabold text-green-800 text-xs uppercase tracking-wider mb-3">Tourist Privileges</h3>
              <ul className="space-y-2.5 text-xs text-gray-600 font-bold">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-green-600 shrink-0" />
                  <span>Book verified safari drivers & reviews</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-green-600 shrink-0" />
                  <span>Real-time animal sightings map</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-green-600 shrink-0" />
                  <span>Instant driver chat & safety alerts</span>
                </li>
              </ul>
            </div>

            <div className="w-full">
              <GoogleBtn onClose={onClose} />
            </div>

            <p className="text-[10px] text-gray-400 font-semibold text-center mt-2 leading-relaxed">
              By logging in you agree to our terms of wildlife protection and local community support guidelines.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
