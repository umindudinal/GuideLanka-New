import {
  Route,
  AlertOctagon,
  HelpCircle,
  TrafficCone,
  Compass,
  CheckCircle2
} from 'lucide-react';

export default function RouteConfigPanel({ routes, setRoutes }) {

  const handleToggleStatus = (routeId, newStatus) => {
    setRoutes(prev => prev.map(r => {
      if (r.id === routeId) {
        let newCongestion = r.congestion;

        if (newStatus === 'CLOSED') {
          newCongestion = 'NONE';
        }
        else if (newStatus === 'CONGESTED' && r.congestion === 'NONE') {
          newCongestion = 'HIGH';
        }
        else if (newStatus === 'ACTIVE' && r.congestion === 'NONE') {
          newCongestion = 'LOW';
        }

        return { ...r, status: newStatus, congestion: newCongestion };
      }
      return r;
    }));
  };

  const handleToggleCongestion = (routeId, newCongestion) => {
    setRoutes(prev => prev.map(r => {
      if (r.id === routeId) {
        return { ...r, congestion: newCongestion };
      }
      return r;
    }));
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">ACTIVE</span>;
      case 'CONGESTED':
        return <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">CONGESTED</span>;
      case 'CLOSED':
        return <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">CLOSED / BLOCKED</span>;
      default:
        return null;
    }
  };

  const getCongestionBadge = (congestion) => {
    switch (congestion?.toUpperCase()) {
      case 'LOW':
        return <span className="text-emerald-400 font-bold">Low Traffic</span>;
      case 'MODERATE':
        return <span className="text-amber-400 font-bold">Moderate Traffic</span>;
      case 'HIGH':
        return <span className="text-rose-400 font-bold">High Congestion</span>;
      default:
        return <span className="text-slate-500 font-bold">No Traffic</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans">

      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Park Route Controllers</h3>
          <p className="text-xs text-slate-500">Manage route permissions, traffic restrictions, and danger-zone designations for Yala National Park.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-2xl w-full md:max-w-sm text-xs text-slate-400 leading-relaxed flex gap-2.5">
          <HelpCircle className="text-emerald-400 shrink-0 mt-0.5" size={16} />
          <p>
            Route statuses directly impact backend <span className="text-emerald-400 font-semibold font-mono">S2R (Sighting-to-Route)</span> calculations, modifying guide path suggestions to prevent traffic jams.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {routes.map((route) => (
          <div key={route.id} className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition">

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Compass size={16} className="text-emerald-400 shrink-0" />
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-100">{route.name}</h4>
                  {getStatusBadge(route.status)}
                </div>
                <p className="text-xs text-slate-400 leading-normal">
                  <span className="font-semibold text-slate-500">Track:</span> {route.checkpoints}
                </p>
                <div className="text-xs text-slate-500 mt-2">
                  Current Density: <span className="text-slate-300 font-semibold">{getCongestionBadge(route.congestion)}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 border-t lg:border-t-0 lg:border-l border-slate-800 pt-4 lg:pt-0 lg:pl-6">

                <div className="space-y-1.5 w-full sm:w-auto">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Modify Status</span>
                  <div className="flex flex-wrap bg-slate-950 p-1 rounded-xl border border-slate-850">
                    <button
                      onClick={() => handleToggleStatus(route.id, 'ACTIVE')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex-1 sm:flex-initial text-center ${
                        route.status === 'ACTIVE'
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Open
                    </button>
                    <button
                      onClick={() => handleToggleStatus(route.id, 'CONGESTED')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex-1 sm:flex-initial text-center ${
                        route.status === 'CONGESTED'
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Congested
                    </button>
                    <button
                      onClick={() => handleToggleStatus(route.id, 'CLOSED')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex-1 sm:flex-initial text-center ${
                        route.status === 'CLOSED'
                          ? 'bg-rose-500 text-slate-950 shadow-md shadow-rose-500/10'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Close Route
                    </button>
                  </div>
                </div>

                {route.status !== 'CLOSED' && (
                  <div className="space-y-1.5 w-full sm:w-auto animate-fade-in">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Congestion Override</span>
                    <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
                      <button
                        onClick={() => handleToggleCongestion(route.id, 'LOW')}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex-1 sm:flex-initial text-center ${
                          route.congestion === 'LOW'
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        Low
                      </button>
                      <button
                        onClick={() => handleToggleCongestion(route.id, 'MODERATE')}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex-1 sm:flex-initial text-center ${
                          route.congestion === 'MODERATE'
                            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        Mod
                      </button>
                      <button
                        onClick={() => handleToggleCongestion(route.id, 'HIGH')}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex-1 sm:flex-initial text-center ${
                          route.congestion === 'HIGH'
                            ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        High
                      </button>
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
