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
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  isMobileOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse
}) {

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
        className={`fixed lg:static top-0 left-0 z-50 h-screen bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Header */}
          <div className={`p-4 lg:p-5 border-b border-slate-800 flex items-center ${isCollapsed ? 'lg:justify-center' : 'justify-between'} transition-all`}>
            {/* Desktop Collapsed View */}
            {isCollapsed ? (
              <div className="hidden lg:flex flex-col items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 p-1.5 flex items-center justify-center shadow-md">
                  <img src={logoImg} alt="GuideLanka" className="w-full h-full object-contain" />
                </div>
              </div>
            ) : null}

            {/* Expanded View (always rendered on mobile, and on desktop when not collapsed) */}
            <div className={`${isCollapsed ? 'flex lg:hidden' : 'flex'} items-center justify-between w-full`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 p-1.5 flex items-center justify-center shrink-0 shadow-md">
                  <img src={logoImg} alt="GuideLanka" className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-extrabold text-sm tracking-tight text-slate-100 uppercase truncate">GuideLanka</h2>
                  <span className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase block truncate">Park Ranger Command</span>
                </div>
              </div>

              {/* Mobile Close Button */}
              <button
                onClick={onClose}
                className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer shrink-0 ml-2"
                title="Close Menu"
                type="button"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className={`p-4 space-y-1.5 mt-2 transition-all ${isCollapsed ? 'lg:px-2.5' : 'lg:p-4'}`}>
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  title={item.label}
                  className={`w-full flex items-center rounded-2xl text-sm font-bold tracking-wide transition-all duration-200 cursor-pointer group relative ${
                    isCollapsed
                      ? 'lg:justify-center lg:px-0 lg:py-3 px-4 py-3 gap-3.5'
                      : 'px-4 py-3 gap-3.5'
                  } ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-md shadow-emerald-500/5'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <IconComponent
                    size={18}
                    className={`${isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'} shrink-0`}
                  />
                  <span className={`truncate ${isCollapsed ? 'lg:hidden' : 'inline'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t border-slate-800 space-y-3 shrink-0 transition-all ${isCollapsed ? 'lg:p-2.5 lg:space-y-2' : 'lg:p-4'}`}>
          <button
            onClick={() => handleTabClick('profile')}
            title={user?.full_name ? `${user.full_name} (${user.role || 'Ranger Authority'})` : 'Officer Profile'}
            className={`w-full flex items-center rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
              isCollapsed
                ? 'lg:justify-center lg:p-1.5 p-2.5 gap-3'
                : 'p-2.5 gap-3'
            } ${
              activeTab === 'profile'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-md shadow-emerald-500/5'
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

            <div className={`min-w-0 flex-1 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
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
            title="Exit Secure Session"
            className={`w-full flex items-center justify-center bg-slate-850 hover:bg-slate-800 border border-slate-800 text-rose-400 hover:text-rose-300 font-bold rounded-2xl transition cursor-pointer ${
              isCollapsed
                ? 'lg:py-2.5 lg:px-0 py-2.5 px-4 gap-2 text-xs'
                : 'py-2.5 px-4 gap-2 text-xs'
            }`}
          >
            <LogOut size={16} className="shrink-0" />
            <span className={isCollapsed ? 'lg:hidden' : 'inline'}>Exit Secure Session</span>
          </button>
        </div>
      </aside>
    </>
  );
}
