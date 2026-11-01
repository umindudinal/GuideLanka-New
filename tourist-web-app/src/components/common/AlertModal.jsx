import { X, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

export default function AlertModal({ isOpen, onClose, title, message, type = 'warning' }) {
  if (!isOpen) return null;

  const config = {
    warning: {
      icon: '<AlertTriangle />',
      bgIcon: 'bg-amber-50 border-amber-200',
      titleColor: 'text-amber-950',
      buttonClass: 'bg-amber-500 hover:bg-amber-600',
      accentColor: '#f59e0b',
      defaultTitle: 'Attention Required'
    },
    success: {
      icon: '<CheckCircle />',
      bgIcon: 'bg-emerald-50 border-emerald-200',
      titleColor: 'text-emerald-950',
      buttonClass: 'bg-emerald-600 hover:bg-emerald-700',
      accentColor: '#10b981',
      defaultTitle: 'Success'
    },
    error: {
      icon: '<XCircle />',
      bgIcon: 'bg-rose-50 border-rose-200',
      titleColor: 'text-rose-950',
      buttonClass: 'bg-rose-600 hover:bg-rose-700',
      accentColor: '#f43f5e',
      defaultTitle: 'Something Went Wrong'
    },
    info: {
      icon: '<Info />',
      bgIcon: 'bg-sky-50 border-sky-200',
      titleColor: 'text-sky-950',
      buttonClass: 'bg-sky-600 hover:bg-sky-700',
      accentColor: '#0ea5e9',
      defaultTitle: 'Information'
    }
  };

  const iconMap = {
    warning: <AlertTriangle size={36} color="#f59e0b" />,
    success: <CheckCircle size={36} color="#10b981" />,
    error: <XCircle size={36} color="#f43f5e" />,
    info: <Info size={36} color="#0ea5e9" />
  };

  const c = config[type] || config.warning;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <style>{`
        @keyframes alertFadeIn {
          from { opacity: 0; transform: scale(0.9) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .alert-card { animation: alertFadeIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .alert-ok-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(0,0,0,0.2); }
        .alert-close-btn:hover { background: #e5e7eb; }
      `}</style>

      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)'
        }}
      />

      <div className="alert-card" style={{
        position: 'relative',
        background: '#ffffff',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 32px 64px -16px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        zIndex: 10
      }}>
        <div style={{ height: '5px', background: c.accentColor, width: '100%' }} />

        <button
          className="alert-close-btn"
          onClick={onClose}
          style={{
            position: 'absolute', top: '14px', right: '14px',
            background: '#f3f4f6', border: 'none', borderRadius: '50%',
            width: '30px', height: '30px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#9ca3af', transition: 'background 0.15s'
          }}
        >
          <X size={15} />
        </button>

        <div style={{ padding: '32px 28px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{
            padding: '14px', borderRadius: '18px', marginBottom: '18px',
            background: type === 'warning' ? '#fffbeb' : type === 'success' ? '#f0fdf4' : type === 'error' ? '#fff1f2' : '#f0f9ff',
            border: '1px solid',
            borderColor: type === 'warning' ? '#fde68a' : type === 'success' ? '#bbf7d0' : type === 'error' ? '#fecdd3' : '#bae6fd'
          }}>
            {iconMap[type]}
          </div>

          <h3 style={{
            fontSize: '18px', fontWeight: 900, marginBottom: '10px',
            color: type === 'warning' ? '#451a03' : type === 'success' ? '#052e16' : type === 'error' ? '#4c0519' : '#082f49',
            letterSpacing: '-0.3px', lineHeight: 1.3
          }}>
            {title || c.defaultTitle}
          </h3>

          <p style={{ color: '#6b7280', fontSize: '14px', fontWeight: 500, lineHeight: 1.65, marginBottom: '24px' }}>
            {message}
          </p>

          <button
            className="alert-ok-btn"
            onClick={onClose}
            style={{
              width: '100%', padding: '13px',
              borderRadius: '14px', border: 'none',
              background: c.accentColor,
              color: '#fff',
              fontSize: '15px', fontWeight: 800,
              cursor: 'pointer', letterSpacing: '0.2px',
              transition: 'all 0.18s',
              boxShadow: '0 4px 14px rgba(0,0,0,0.18)'
            }}
          >
            OK, Got It
          </button>
        </div>
      </div>
    </div>
  );
}
