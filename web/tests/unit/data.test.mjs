// The story data is consistent with itself.
import { CLUES, DEDUCTIONS, ITEMS } from '../../src/story/data.js';
import { ok } from './assert.mjs';

export const tests = [
  ['cada deducción une dos pistas existentes', () => {
    for (const d of DEDUCTIONS) ok(CLUES[d.a] && CLUES[d.b], `${d.id}: ${d.a} + ${d.b}`);
  }],
  ['los ids de deducción son únicos', () => {
    const ids = DEDUCTIONS.map((d) => d.id);
    ok(new Set(ids).size === ids.length, 'ids repetidos');
  }],
  ['las 27 deducciones persistidas siguen existiendo', () => {
    const want = ['d_ronda', 'd_zurdo', 'd_barro', 'd_brennan', 'd_bisturi', 'd_delantal', 'd_ordenados', 'd_greaves', 'd_nat', 'd_hospes', 'd_rojo', 'd_pike', 'd_letra', 'd_rapido', 'd_testigo', 'd_estuche', 'd_aqui', 'd_confianza', 'd_trofeo', 'd_firma', 'd_guantes', 'f_zurdo', 'f_anat', 'f_testigo', 'f_ronda', 'f_exp', 'f_barro'];
    for (const id of want) ok(DEDUCTIONS.some((d) => d.id === id), `falta ${id}`);
  }],
  ['las pistas y objetos persistidos siguen existiendo', () => {
    const clues = ['botas', 'ventana', 'laudano', 'ronda', 'silencio', 'zurdo', 'anatomia', 'huellas', 'brennan_zurdo', 'bisturi', 'cuello', 'regla', 'delantal', 'ordenados', 'greaves_sabe', 'anillos', 'falta', 'reflejo', 'alguien_detras', 'nat_voz', 'hospes', 'dedos', 'llave_pike', 'rapido', 'trozo', 'marcas', 'guantes', 'aqui_estoy', 'testigo', 'carta', 'letra', 'estuche', 'expediente', 'respuesta1879', 'ficha'];
    for (const id of clues) ok(CLUES[id], `falta la pista ${id}`);
    for (const id of ['penique', 'bisturi', 'peine', 'tinta', 'placa', 'llave']) ok(ITEMS[id], `falta el objeto ${id}`);
  }],
];
