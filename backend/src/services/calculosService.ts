import { Muro } from '../models/Muro';

export function estimarPanel(panel: Muro, opciones?: { qViento?: number, nPuntales?: number, anguloPuntal?: number }) {
  const alto = panel.area ? Math.sqrt(panel.area) : 0;
  const ancho = panel.area ? Math.sqrt(panel.area) : 0;
  const espesor = panel.grosor ?? 0;
  const qViento = opciones?.qViento ?? 0.5;
  const nPuntales = opciones?.nPuntales ?? 2;
  const anguloPuntal = opciones?.anguloPuntal ?? 45;

  const densidad = 24;
  const area = panel.area ?? 0;
  const volumen = area * espesor;
  const peso = volumen * densidad;
  const gruaMin = 1.15 * peso;
  const Fv = qViento * area;
  const ang = (anguloPuntal * Math.PI) / 180;
  const T = nPuntales ? (Fv / nPuntales) / Math.cos(ang) : 0;

  return {
    id_muro: panel.id_muro,
    volumen_m3: +volumen.toFixed(3),
    peso_kN: +peso.toFixed(2),
    grua_min_kN_aprox: +gruaMin.toFixed(1),
    viento_kN: +Fv.toFixed(2),
    traccion_puntal_kN_aprox: +T.toFixed(2),
  };
}

export function estimarPaneles(paneles: Muro[], opciones?: any) {
  return paneles.map(panel => estimarPanel(panel, opciones));
}