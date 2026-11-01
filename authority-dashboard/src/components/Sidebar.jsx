import logoImg from '../assets/logo.png';
import {
  LayoutDashboard,
  Map,
  ShieldAlert,
  Users,
  Route,
  LogOut,
  TrendingUp,
  Coins,
  FileText,
  X
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, user, onLogout, isMobileOpen, onClose }) {

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'map', label: 'Live Operations Map', icon: Map },
    { id: 'alerts', label: 'Emergency (SOS)', icon: ShieldAlert },
    { id: 'drivers', label: 'Driver Directory', icon: Users },
    // { id: 'routes', label: 'Route Controller', icon: Route },
    { id: 'tourists', label: 'Tourist Analytics', icon: TrendingUp },
    { id: 'revenue', label: 'Revenue Tracker', icon: Coins },
    { id: 'reports', label: 'Reports & Analysis', icon: FileText },
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (onClose) onClose();
  };

  return (
    <>

      {isMobileOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 z-50 h-screen w-72 lg:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="p-5 lg:p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 p-1.5 flex items-center justify-center shrink-0 shadow-md">
                <img src={logoImg} alt="GuideLanka" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm tracking-tight text-slate-100 uppercase">GuideLanka</h2>
                <span className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase">Park Ranger Command</span>
              </div>
            </div>

            {}
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer"
              title="Close Menu"
              type="button"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="p-4 space-y-1.5 mt-2">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold tracking-wide transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-linear-to-r from-emerald-500/10 to-teal-500/10 text-emerald-400 border border-emerald-500/20 shadow-md shadow-emerald-500/5'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <IconComponent size={18} className={isActive ? 'text-emerald-400' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 space-y-3 shrink-0">
          <button
            onClick={() => handleTabClick('profile')}
            className={`w-full flex items-center gap-3 p-2.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-linear-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-400 shadow-md shadow-emerald-500/5'
                : 'bg-transparent border-transparent hover:bg-slate-800/40 hover:border-slate-800/60 text-slate-200'
            }`}
          >
            {user?.profile_image || (user?.id && localStorage.getItem('admin_avatar_' + user.id)) ? (
              <img
                src={user.profile_image || localStorage.getItem('admin_avatar_' + user.id)}
                alt="Avatar"
                className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-800"
              />
            ) : (
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold uppercase text-sm shrink-0 transition ${
                activeTab === 'profile' ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-800 border-slate-700 text-emerald-400'
              }`}>
                {user?.full_name?.charAt(0) || 'A'}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h4 className={`text-xs font-bold truncate transition ${activeTab === 'profile' ? 'text-emerald-400' : 'text-slate-200'}`}>
                {user?.full_name || 'Park Officer'}
              </h4>
              <span className="text-[9px] text-slate-500 font-black tracking-wider uppercase truncate block mt-0.5">
                {user?.role || 'Ranger Authority'}
              </span>
            </div>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-rose-400 hover:text-rose-300 font-bold py-2.5 rounded-2xl text-xs transition cursor-pointer"
          >
            <LogOut size={14} />
            <span>Exit Secure Session</span>
          </button>
        </div>
      </aside>
    </>
  );
}
