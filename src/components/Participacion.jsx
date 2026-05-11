import React from 'react';

const C  = '#01f3b3';
const CD = '#00b38a';

const normalize = (str) =>
  String(str || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

const fmtPct = (n) => Number(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtNum = (n) => Number(n).toLocaleString('es-ES');

const ORDER = ['Andalucía', 'Almería', 'Cádiz', 'Córdoba', 'Granada', 'Huelva', 'Jaén', 'Málaga', 'Sevilla'];

const Participacion = ({ participacionData }) => {
  if (!participacionData || participacionData.length === 0) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-7 h-7 rounded-full border-2 animate-spin"
          style={{ borderColor: `${C}30`, borderTopColor: C }} />
      </div>
    );
  }

  const items = ORDER.map((nombre) =>
    participacionData.find((d) => normalize(d.nombre_ambito) === normalize(nombre))
  ).filter(Boolean);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(9, 1fr)',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      overflow: 'hidden',
    }}>
      {items.map((item, i) => {
        const isAndalucia = normalize(item.nombre_ambito) === 'andalucia';
        return (
          <div
            key={item.nombre_ambito}
            style={{
              padding: '12px 10px',
              borderRight: i < items.length - 1 ? '1px solid #e5e7eb' : 'none',
              borderTop: isAndalucia ? `3px solid ${C}` : '3px solid transparent',
              background: isAndalucia ? `${C}18` : '#fff',
              transition: 'background .15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = isAndalucia ? `${C}28` : '#f8fafc'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = isAndalucia ? `${C}18` : '#fff'; }}
          >
            <p style={{
              fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: isAndalucia ? C : '#9ca3af',
              marginBottom: '6px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{item.nombre_ambito}</p>

            <p style={{
              fontSize: '22px', fontWeight: 700, color: C,
              letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '8px',
            }}>{fmtPct(item.participacion)}%</p>

            <div style={{ position: 'relative', height: '2px', borderRadius: '1px', background: isAndalucia ? `${C}30` : '#e5e7eb', overflow: 'hidden', marginBottom: '6px' }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${Math.min(item.participacion, 100)}%`,
                background: C, borderRadius: '1px', transition: 'width .7s ease-out',
              }} />
            </div>

            {item.censo_total > 0 && (
              <p style={{ fontSize: '9px', color: isAndalucia ? CD : '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {fmtNum(item.censo_total)} hab.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Participacion;
