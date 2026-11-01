import { useState } from 'react';

import { supabase } from '../services/supabase';

import {
  AlertTriangle,
  User,
  Phone,
  Navigation,
  ShieldCheck,
  CheckCircle2,
  Siren,
  ExternalLink
} from 'lucide-react';

export default function SOSPanel({ alerts, setAlerts, onActionComplete, minimal = false, drivers = [] }) {
  const [updatingId, setUpdatingId] = useState(null);
  const [dispatchedAlertIds, setDispatchedAlertIds] = useState([]);

  const getDriverInfo = (alert) => {
    const driver = alert.driver || (Array.isArray(drivers) ? drivers.find(d => d.id === alert.driver_id) : null);
    const name = driver?.full_name || alert.driver_name || null;
    const phone = driver?.phone_number || alert.driver_phone || null;
    return { name, phone };
  };

  const handleUpdateStatus = async (alertId, newStatus) => {
    setUpdatingId(alertId);
    try {
      const { error: eErr } = await supabase
        .from('emergency_alerts')
        .update({ status: newStatus })
        .eq('id', alertId);

      await supabase
        .from('alerts')
        .update({ status: newStatus })
        .eq('id', alertId);

      setAlerts(prev => prev.map(alert =>
        alert.id === alertId ? { ...alert, status: newStatus } : alert
      ));

      if (onActionComplete) {
        onActionComplete();
      }
    } catch (err) {
      console.error("Failed to update SOS alert status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const activeAlerts = alerts.filter(a => ['ACTIVE', 'PENDING', 'RANGER DISPATCHED'].includes(a.status?.toUpperCase()));
  const resolvedAlerts = alerts.filter(a => ['RESOLVED'].includes(a.status?.toUpperCase()));

  if (minimal) {
    return (
      <div className="space-y-4">
        {activeAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 sm:py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 mb-3">
              <ShieldCheck size={20} />
            </div>
            <h4 className="text-sm font-bold text-slate-300">Park Secure</h4>
            <p className="text-[10px] text-slate-500 mt-1 max-w-50">No active SOS alarms reported from the field.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeAlerts.map((alert) => {
              const isDispatched = dispatchedAlertIds.includes(alert.id);
              const driverInfo = getDriverInfo(alert);
              return (
                <div key={alert.id} className="bg-slate-950 border border-rose-500/30 p-4 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 h-1 bg-rose-500 w-full animate-pulse"></div>

                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] text-rose-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
                        <Siren size={10} className="animate-spin" />
                        {isDispatched ? 'Ranger En Route' : 'SOS Active'}
                      </span>
                      <h4 className="text-sm font-black text-slate-200 mt-1">{alert.alert_type || 'Vehicle Issue'}</h4>
                      <div className="mt-1.5 space-y-0.5 text-xs">
                        <p className="text-[11px] text-slate-200 font-bold truncate max-w-50 flex items-center gap-1">
                          <User size={12} className="text-emerald-400 shrink-0" />
                          <span>{driverInfo.name || `Guide: ${alert.driver_id?.slice(0, 8)}...`}</span>
                        </p>
                        {driverInfo.phone ? (
                          <p className="text-[11px] text-emerald-400 font-mono truncate max-w-50 flex items-center gap-1 font-semibold">
                            <Phone size={11} className="text-emerald-400 shrink-0" />
                            <a href={`tel:${driverInfo.phone}`} className="hover:underline">{driverInfo.phone}</a>
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    {!isDispatched ? (
                      <button
                        onClick={() => setDispatchedAlertIds(prev => [...prev, alert.id])}
                        className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-xl text-xs transition cursor-pointer text-center"
                      >
                        Dispatch Ranger
                      </button>
                    ) : null}
                    <button
                      onClick={() => handleUpdateStatus(alert.id, 'RESOLVED')}
                      disabled={updatingId === alert.id}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2 rounded-xl text-xs transition cursor-pointer text-center"
                    >
                      Mark Resolved
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">

      <div>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Active SOS Incidents</h3>

        {activeAlerts.length === 0 ? (
          <div className="bg-slate-950 border border-slate-800/80 p-6 sm:p-8 rounded-3xl text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 mb-3 mx-auto">
              <ShieldCheck size={24} />
            </div>
            <h4 className="text-base font-bold text-slate-200">No Active Emergencies</h4>
            <p className="text-xs text-slate-500 mt-1">All guides and visitors are accounted for and secure.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {activeAlerts.map((alert) => {
              const isDispatched = dispatchedAlertIds.includes(alert.id);
              const driverInfo = getDriverInfo(alert);
              return (
                <div key={alert.id} className="bg-slate-900 border border-rose-500/30 p-5 sm:p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between shadow-lg shadow-rose-950/20">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-rose-500 to-red-600 animate-pulse"></div>

                  <div>
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        isDispatched
                          ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                          : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                      }`}>
                        {isDispatched ? 'RANGER EN ROUTE' : alert.status}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {alert.timestamp ? new Date(alert.timestamp).toLocaleString() : 'Just now'}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-black text-slate-100 mt-4 flex items-center gap-2">
                      <AlertTriangle className="text-rose-500 shrink-0" size={20} />
                      <span className="truncate">{alert.alert_type || 'SOS Emergency Alert'}</span>
                    </h3>

                    <div className="space-y-3 mt-4 border-t border-slate-800/60 pt-4 text-xs">
                      {/* Driver Name & ID */}
                      <div className="flex items-center justify-between gap-2 text-slate-300">
                        <div className="flex items-center gap-2 truncate">
                          <User size={15} className="text-emerald-400 shrink-0" />
                          <span className="font-bold text-slate-100 text-sm truncate">
                            {driverInfo.name || 'Safari Guide'}
                          </span>
                        </div>
                        {alert.driver_id && (
                          <span className="text-[10px] text-slate-500 font-mono shrink-0">
                            ID: {alert.driver_id.slice(0, 8)}...
                          </span>
                        )}
                      </div>

                      {/* Driver Mobile Phone with Click-to-Call */}
                      <div className="flex items-center gap-2 text-slate-300">
                        <Phone size={14} className="text-emerald-400 shrink-0" />
                        {driverInfo.phone ? (
                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${driverInfo.phone}`}
                              className="font-mono text-emerald-400 hover:text-emerald-300 hover:underline font-bold text-xs"
                              title="Call Driver"
                            >
                              {driverInfo.phone}
                            </a>
                            <a
                              href={`tel:${driverInfo.phone}`}
                              className="text-[10px] bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full font-sans uppercase font-bold transition flex items-center gap-1"
                            >
                              Call Now
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">No mobile number registered</span>
                        )}
                      </div>

                      {/* Coordinates */}
                      <div className="flex items-center justify-between gap-2 text-slate-400 truncate pt-0.5">
                        <div className="flex items-center gap-2 truncate">
                          <Navigation size={14} className="text-slate-500 shrink-0" />
                          <span className="truncate">
                            Coordinates: <span className="font-mono text-slate-200">{Number(alert.latitude).toFixed(5)}, {Number(alert.longitude).toFixed(5)}</span>
                          </span>
                        </div>
                        <a
                          href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-sky-400 hover:underline shrink-0 flex items-center gap-1 font-semibold"
                        >
                          <span>View on Maps</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mt-6">
                    {!isDispatched ? (
                      <button
                        onClick={() => setDispatchedAlertIds(prev => [...prev, alert.id])}
                        className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-2xl text-xs transition cursor-pointer text-center"
                      >
                        Dispatch Ranger Unit
                      </button>
                    ) : null}
                    <button
                      onClick={() => handleUpdateStatus(alert.id, 'RESOLVED')}
                      disabled={updatingId === alert.id}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-2xl text-xs transition cursor-pointer text-center"
                    >
                      Mark Incident Resolved
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Resolved Incident History</h3>
        {resolvedAlerts.length === 0 ? (
          <p className="text-xs text-slate-600 italic">No resolved records in history.</p>
        ) : (
          <div className="bg-slate-900/20 border border-slate-900 rounded-3xl divide-y divide-slate-900/60 overflow-hidden">
            {resolvedAlerts.map((alert) => {
              const driverInfo = getDriverInfo(alert);
              return (
                <div key={alert.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-900/10 transition">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-800 text-slate-500 p-2 rounded-xl shrink-0">
                      <CheckCircle2 size={16} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-300 truncate">{alert.alert_type || 'SOS Alert'}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {driverInfo.name ? (
                          <span>
                            <span className="font-bold text-slate-300">{driverInfo.name}</span>
                            {driverInfo.phone ? ` • ${driverInfo.phone}` : ''}
                          </span>
                        ) : (
                          `Driver ID: ${alert.driver_id?.slice(0, 8)}...`
                        )} • Resolved
                      </p>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full self-start sm:self-auto shrink-0">
                    RESOLVED
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
