import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { RefreshCw, Vote, Users, MapPin, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import Participacion from './components/Participacion';

const C  = '#01f3b3';
const CD = '#00b38a';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (value) => {
  const num = Number(String(value).replace('%', '').replace(',', '.'));
  if (Number.isNaN(num)) return value;
  return num.toLocaleString('es-ES', {
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
};

const normalizeStr = (str) =>
  String(str || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

const makeMunicipioKey = (n, p) => `${normalizeStr(n)}|${normalizeStr(p)}`;

// ── Hemiciclo geometry ────────────────────────────────────────────────────────

const deg2rad = (d) => (d * Math.PI) / 180;
const polar   = (cx, cy, r, a) => ({ x: cx + r * Math.cos(deg2rad(a)), y: cy - r * Math.sin(deg2rad(a)) });

const arcPath = (cx, cy, ri, ro, a0, a1) => {
  const os = polar(cx, cy, ro, a0), oe = polar(cx, cy, ro, a1);
  const ie = polar(cx, cy, ri, a1), is_ = polar(cx, cy, ri, a0);
  const la = Math.abs(a1 - a0) > 180 ? 1 : 0;
  const sw = a1 > a0 ? 0 : 1;
  return [
    'M', os.x, os.y, 'A', ro, ro, 0, la, sw, oe.x, oe.y,
    'L', ie.x, ie.y, 'A', ri, ri, 0, la, sw ? 0 : 1, is_.x, is_.y, 'Z',
  ].join(' ');
};

// ── AnimatedNumber ────────────────────────────────────────────────────────────

const AnimatedNumber = ({ value, suffix = '' }) => {
  const [disp, setDisp] = useState(0);
  useEffect(() => {
    const steps = 30;
    const inc = value / steps;
    let cur = 0, step = 0;
    const t = setInterval(() => {
      step++;
      cur = Math.min(value, inc * step);
      setDisp(cur);
      if (step >= steps) { clearInterval(t); setDisp(value); }
    }, 1000 / steps);
    return () => clearInterval(t);
  }, [value]);
  return <span>{fmt(disp)}{suffix}</span>;
};

// ── Card ──────────────────────────────────────────────────────────────────────
// flex flex-col + h-full so it fills its grid cell when grid uses stretch

const CARD_HEADER_STYLE = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 16px',
  borderBottom: '1px solid #f3f4f6',
  flexShrink: 0,
};

const CARD_LABEL_STYLE = {
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#9ca3af',
};

const TealBar = () => (
  <span style={{ display: 'inline-block', width: '3px', height: '14px', borderRadius: '2px', background: C, flexShrink: 0 }} />
);

const Card = ({ children, className = '', title, icon: Icon }) => (
  <div
    className={`bg-white border border-slate-200 overflow-hidden flex flex-col h-full ${className}`}
    style={{ borderRadius: '10px' }}
  >
    {title && (
      <div style={CARD_HEADER_STYLE}>
        <TealBar />
        <span style={CARD_LABEL_STYLE}>{title}</span>
        {Icon && <Icon style={{ width: 12, height: 12, color: C, marginLeft: 'auto' }} />}
      </div>
    )}
    <div style={{ padding: '16px', flex: 1, minHeight: 0 }}>{children}</div>
  </div>
);

// ── DatawrapperCard ───────────────────────────────────────────────────────────

const DatawrapperCard = ({ title, icon: Icon, chartId, version = 1, iframeTitle, className = '', height = 410 }) => {
  useEffect(() => {
    const handler = (a) => {
      if (void 0 !== a.data['datawrapper-height']) {
        const iframes = document.querySelectorAll('iframe');
        for (const t in a.data['datawrapper-height']) {
          for (let i = 0; i < iframes.length; i++) {
            if (iframes[i].contentWindow === a.source) {
              iframes[i].style.height = a.data['datawrapper-height'][t] + 'px';
            }
          }
        }
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <div
      className={`bg-white border border-slate-200 overflow-hidden flex flex-col h-full ${className}`}
      style={{ borderRadius: '10px' }}
    >
      <div style={CARD_HEADER_STYLE}>
        <TealBar />
        <span style={CARD_LABEL_STYLE}>{title}</span>
        {Icon && <Icon style={{ width: 12, height: 12, color: C, marginLeft: 'auto' }} />}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 12px' }}>
        <iframe
          title={iframeTitle}
          aria-label="Gráfico de columnas"
          id={`datawrapper-chart-${chartId}`}
          src={`https://datawrapper.dwcdn.net/${chartId}/${version}/`}
          scrolling="no"
          frameBorder="0"
          style={{ width: '0', minWidth: '100%', border: 'none', height: `${height}px`, display: 'block' }}
          data-external="1"
        />
      </div>
    </div>
  );
};

// ── FlourishCard ──────────────────────────────────────────────────────────────
// className prop correctamente pasado al wrapper para que col-span funcione

const FlourishCard = ({ title, icon: Icon, src, iframeTitle, className = '', minH = 480 }) => (
  <div
    className={`bg-white border border-slate-200 overflow-hidden flex flex-col h-full ${className}`}
    style={{ borderRadius: '10px' }}
  >
    <div style={CARD_HEADER_STYLE}>
      <TealBar />
      <span style={CARD_LABEL_STYLE}>{title}</span>
      {Icon && <Icon style={{ width: 12, height: 12, color: C, marginLeft: 'auto' }} />}
    </div>
    <div style={{ flex: 1, minHeight: `${minH}px` }}>
      <iframe
        title={iframeTitle}
        src={src}
        scrolling="no"
        frameBorder="0"
        allowFullScreen
        className="w-full h-full"
        style={{ border: 'none', minHeight: `${minH}px`, display: 'block' }}
      />
    </div>
  </div>
);

// ── App ───────────────────────────────────────────────────────────────────────

const App = () => {
  const [partidosData, setPartidosData]       = useState([]);
  const [participacionData, setParticipacionData] = useState([]);
  const [municipiosInfo, setMunicipiosInfo]   = useState({});
  const [escrutinio, setEscrutinio]           = useState(0);
  const [lastUpdate, setLastUpdate]           = useState('');
  const [isLoading, setIsLoading]             = useState(true);
  const [dataReady, setDataReady]             = useState(false);
  const [isRefreshing, setIsRefreshing]       = useState(false);
  const loadIdRef = useRef(0);

  const { pathname } = useLocation();
  const BASE = import.meta.env.BASE_URL;

  const fetchJSON = async (path) => {
    const res = await fetch(`${BASE}${path}`, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  const processEscanos = (data) => data
    .filter((r) => r.Partido?.trim())
    .map((r) => ({
      nombre:      r.Partido.trim(),
      escanos2023: parseInt(r['2023']) || 0,
      escanos2025: parseInt(r['2026']) || 0,
      cambio:      (parseInt(r['2026']) || 0) - (parseInt(r['2023']) || 0),
      lado:        parseInt(r.lado || r.Lado || '0'),
      color:       r.color ? `#${r.color.replace('#', '')}` : '#94a3b8',
    }))
    .sort((a, b) => b.escanos2025 - a.escanos2025);

  const processEstado = (data) => {
    if (!data?.length) return { escrutinio: 0, lastUpdate: '' };
    const row = data[0];
    const escruNum = parseFloat(String(row.escrutado || row.Escrutado || '0').replace('%', '').replace(',', '.')) || 0;
    const dia = row.dia || row.Dia || row.fecha || '';
    const hora = row.hora || row.Hora || '';
    let updateStr = '';
    if (dia && hora) {
      const parts = String(dia).split(/[\/\-.]/);
      if (parts.length === 3) {
        const [d, m, y] = parts.map(Number);
        if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
          const mes = new Date(y, m - 1, d).toLocaleString('es-ES', { month: 'long' });
          updateStr = `${d} de ${mes} de ${y} — ${hora}`;
        }
      }
    }
    return { escrutinio: escruNum, lastUpdate: updateStr };
  };

  const processMunicipios = (data) => {
    const map = {};
    (data || []).forEach((row) => {
      const nombre    = row.municipio_nombre || row.MUNICIPIO || row.municipio || '';
      const provincia = row.PROVINCIA || row.provincia || '';
      if (!nombre || !provincia) return;
      map[makeMunicipioKey(nombre, provincia)] = { siglas_1: row.siglas_1 || row.SIGLAS_1 || '', raw: row };
    });
    return map;
  };

  const processParticipacion = (data) => data
    .filter((row) => row.territorio)
    .map((row) => {
      const territorio  = (row.territorio || '').trim();
      const isAndalucia = normalizeStr(territorio) === 'andalucia';
      const pct = parseFloat(String(row.participacion || '0').replace('%', '').replace(',', '.')) || 0;
      return {
        ambito:        isAndalucia ? 'Comunidad' : 'Provincia',
        nombre_ambito: territorio,
        mesas_totales: parseInt(String(row.mesas || '0').replace(/\./g, '')) || 0,
        censo_total:   parseInt(String(row.censo || '0').replace(/\./g, '')) || 0,
        participacion: isNaN(pct) ? 0 : pct,
      };
    });

  const loadAllData = useCallback(async (isRefresh = false) => {
    const lid = ++loadIdRef.current;
    if (isRefresh) setIsRefreshing(true);
    else { setIsLoading(true); setDataReady(false); }

    try {
      const [escanosD, estadoD, municipiosD, participacionD] = await Promise.all([
        fetchJSON('data/escanos.json'),
        fetchJSON('data/estado.json'),
        fetchJSON('data/municipios.json'),
        fetchJSON('data/participacion.json'),
      ]);
      if (lid !== loadIdRef.current) return;

      const { escrutinio: esc, lastUpdate: upd } = processEstado(estadoD);
      setPartidosData(processEscanos(escanosD));
      setEscrutinio(esc);
      setLastUpdate(upd);
      setMunicipiosInfo(processMunicipios(municipiosD));
      setParticipacionData(processParticipacion(participacionD));
      setDataReady(true);
    } catch (e) {
      console.error('Error cargando datos:', e);
    } finally {
      if (lid === loadIdRef.current) { setIsLoading(false); setIsRefreshing(false); }
    }
  }, []);

  useEffect(() => {
    loadAllData(false);
    const iv = setInterval(() => loadAllData(true), 300_000);
    const onVis   = () => { if (document.visibilityState === 'visible') loadAllData(true); };
    const onFocus = () => loadAllData(true);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(iv);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onFocus);
    };
  }, [loadAllData]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const escanosData = partidosData.filter((p) => p.escanos2025 > 0 || p.escanos2023 > 0);
  const totalEscanos = 109;
  const mayoria = 55;
  const leftP   = escanosData.filter((p) => p.lado === 1).sort((a, b) => b.escanos2025 - a.escanos2025);
  const rightP  = escanosData.filter((p) => p.lado === 2).sort((a, b) => a.escanos2025 - b.escanos2025);
  const ordered = [...leftP, ...rightP];

  const cx = 200, cy = 200, oR = 180, iR = 100;
  const majAngle = totalEscanos > 0 ? 180 - (mayoria / totalEscanos) * 180 : 180;
  const majStart = polar(cx, cy, iR - 10, majAngle);
  const majEnd   = polar(cx, cy, oR + 10, majAngle);

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading && !dataReady) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            className="animate-spin mx-auto mb-6"
            style={{ width: 40, height: 40, borderRadius: '50%', border: `2px solid ${C}30`, borderTopColor: C }}
          />
          <p style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 22, fontWeight: 800, color: '#0d1117', letterSpacing: '-0.02em' }}>
            Elecciones Andalucía 2026
          </p>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', marginTop: 8 }}>
            Cargando datos
          </p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>

      {/* ── ESCRUTINIO ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ height: 3, background: `linear-gradient(90deg, ${C} 0%, ${CD} 100%)` }} />
        <div className="w-full px-6 lg:px-10" style={{ paddingTop: 14, paddingBottom: 14 }}>

          {/* Fila superior: label + fecha + botón */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="pulse-live" style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: C }} />
              Escrutinio en directo
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {lastUpdate && (
                <span className="hidden sm:block" style={{ fontSize: 11, color: '#9ca3af' }}>{lastUpdate}</span>
              )}
              <button
                onClick={() => loadAllData(true)}
                disabled={isRefreshing}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: C, border: 'none', borderRadius: 7,
                  padding: '6px 13px', cursor: 'pointer',
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  fontSize: 12, fontWeight: 600, color: '#0d1117',
                  opacity: isRefreshing ? 0.5 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                <RefreshCw style={{ width: 13, height: 13 }} className={isRefreshing ? 'animate-spin' : ''} />
                {isRefreshing ? 'Actualizando' : 'Actualizar'}
              </button>
            </div>
          </div>

          {/* Fila inferior: número + barra ancho completo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 40, fontWeight: 700, color: C, letterSpacing: '-0.03em', lineHeight: 1, flexShrink: 0 }}>
              <AnimatedNumber value={escrutinio} suffix="%" />
            </span>
            <div style={{ flex: 1, position: 'relative', height: 6, borderRadius: 3, background: '#f1f5f9', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${escrutinio}%`,
                background: C,
                borderRadius: 3,
                transition: 'width 1s ease-out',
              }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', animation: 'shimmer 2.5s ease-in-out infinite' }} />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── MAIN ── */}
      <main className="w-full px-6 lg:px-10" style={{ paddingTop: 24, paddingBottom: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── / y /participacion ── */}
        {pathname !== '/resultados' && (
          <Card title="Participación electoral" icon={Users}>
            <Participacion participacionData={participacionData} />
          </Card>
        )}

        {/* ── / y /resultados: grid hemiciclo + votos + mapa ── */}
        {pathname !== '/participacion' && (
          <div className="grid grid-cols-1 xl:grid-cols-10 gap-5">

            <Card title="Distribución de escaños" icon={Vote} className="xl:col-span-3">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                <svg viewBox="0 0 400 240" style={{ width: '100%' }}>
                  <defs>
                    <filter id="seg-glow">
                      <feGaussianBlur stdDeviation="2" result="blur"/>
                      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                    <linearGradient id="maj-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#0d1117" stopOpacity="0.9"/>
                      <stop offset="100%" stopColor="#0d1117" stopOpacity="0.2"/>
                    </linearGradient>
                  </defs>

                  <path d={arcPath(cx, cy, iR, oR, 180, 0)} fill="#f1f5f9" />

                  {totalEscanos > 0 && (() => {
                    let acc = 0;
                    return ordered.map((p, i) => {
                      const a0 = 180 - (acc / totalEscanos) * 180;
                      const a1 = 180 - ((acc + p.escanos2025) / totalEscanos) * 180;
                      acc += p.escanos2025;
                      const lp = polar(cx, cy, (iR + oR) / 2, (a0 + a1) / 2);
                      return (
                        <g key={`s${i}`} filter="url(#seg-glow)">
                          <path d={arcPath(cx, cy, iR, oR, a0, a1)} fill={p.color} stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
                          {p.escanos2025 >= 3 && (
                            <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle"
                              fill="#fff" fontSize="15" fontWeight="700"
                              style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
                              {p.escanos2025}
                            </text>
                          )}
                        </g>
                      );
                    });
                  })()}

                  <line x1={majStart.x} y1={majStart.y} x2={majEnd.x} y2={majEnd.y}
                    stroke="url(#maj-grad)" strokeWidth="2" strokeDasharray="5,3" />

                  <text x={cx} y={cy - 26} textAnchor="middle" fill="#9ca3af" fontSize="11"
                    style={{ fontFamily: "'Instrument Sans', system-ui", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Mayoría
                  </text>
                  <text x={cx} y={cy + 2} textAnchor="middle" fill={CD} fontSize="26" fontWeight="500"
                    style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
                    {mayoria}
                  </text>
                  <text x={cx} y={cy + 20} textAnchor="middle" fill="#9ca3af" fontSize="10"
                    style={{ fontFamily: "'Instrument Sans', system-ui", textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    escaños
                  </text>
                </svg>

                {/* Leyenda */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 8, marginBottom: 12, width: '100%' }}>
                  {escanosData.map((p) => (
                    <div key={p.nombre} style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '3px 8px', borderRadius: 5,
                      border: '1px solid #f3f4f6', background: '#f8fafc',
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: '#6b7280', fontFamily: "'Instrument Sans', system-ui" }}>{p.nombre}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#0d1117', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>{p.escanos2025}</span>
                    </div>
                  ))}
                </div>

                {/* Tabla */}
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      {['Partido', '2026', '2022', 'Var.'].map((h, i) => (
                        <th key={h} style={{
                          padding: '5px 6px',
                          textAlign: i === 0 ? 'left' : 'center',
                          fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                          color: '#9ca3af',
                          fontFamily: "'Instrument Sans', system-ui",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {escanosData.map((p) => (
                      <tr key={p.nombre} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '5px 6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 12, fontWeight: 500, color: '#374151', fontFamily: "'Instrument Sans', system-ui" }}>{p.nombre}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', padding: '5px 6px' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: CD, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>{p.escanos2025}</span>
                        </td>
                        <td style={{ textAlign: 'center', padding: '5px 6px' }}>
                          <span style={{ fontSize: 12, color: '#9ca3af', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>{p.escanos2023}</span>
                        </td>
                        <td style={{ textAlign: 'center', padding: '5px 6px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 2,
                            padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                            background: p.cambio > 0 ? '#ecfdf5' : p.cambio < 0 ? '#fef2f2' : '#f8fafc',
                            color: p.cambio > 0 ? '#059669' : p.cambio < 0 ? '#dc2626' : '#9ca3af',
                          }}>
                            {p.cambio > 0 && <TrendingUp style={{ width: 10, height: 10 }} />}
                            {p.cambio < 0 && <TrendingDown style={{ width: 10, height: 10 }} />}
                            {p.cambio > 0 ? '+' : ''}{p.cambio}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Votos — Datawrapper */}
            <DatawrapperCard
              className="xl:col-span-3"
              title="Porcentaje de votos"
              icon={BarChart3}
              iframeTitle="Porcentaje de voto elecciones Andalucía 2026"
              chartId="ogvj5"
              height={410}
            />

            {/* Mapa — Datawrapper */}
            <DatawrapperCard
              className="xl:col-span-4"
              title="Resultados por municipio"
              icon={MapPin}
              iframeTitle="Mapa Electoral Andalucía 2026"
              chartId="AcNer"
              height={463}
            />
          </div>
        )}

        {/* ── /participacion: mapa a ancho completo ── */}
        {pathname === '/participacion' && (
          <DatawrapperCard
            title="Participación por municipios"
            icon={MapPin}
            iframeTitle="Participación por municipios"
            chartId="gsbLM"
            height={428}
          />
        )}

      </main>
    </div>
  );
};

export default App;
