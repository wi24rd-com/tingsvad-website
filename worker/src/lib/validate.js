// Lille, streng validering af request-felter og af modellens JSON-output.
import { ApiError, msg } from './http.js';

export function str(v, { max = 500, min = 0, name = 'field', lang = 'da' } = {}) {
  if (v == null) v = '';
  if (typeof v !== 'string') throw new ApiError('bad_request', `${name}: string expected`, 400);
  const s = v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim(); // runde 13 (L2): også linjeskift, så gæstetekst ikke kan ligne nye linjer i en prompt
  if (s.length > max) throw new ApiError('too_long', msg(lang, 'long', { n: max }), 413);
  if (s.length < min) throw new ApiError('bad_request', `${name}: too short`, 400);
  return s;
}
export function oneOf(v, allowed, name = 'field') {
  if (!allowed.includes(v)) throw new ApiError('bad_request', `${name}: must be one of ${allowed.join(', ')}`, 400);
  return v;
}
export function strList(v, { max = 8, itemMax = 32 } = {}) {
  if (v == null) return [];
  if (!Array.isArray(v)) throw new ApiError('bad_request', 'array expected', 400);
  return v.slice(0, max).filter(x => typeof x === 'string').map(x => x.slice(0, itemMax).replace(/[^\w-]/g, ''));
}

// Godkend AI-output mod et simpelt skema: {type:'object', properties:{k:{type, enum?, maxLength?, items?, minItems?, maxItems?}}, required:[]}
export function conform(value, schema, path = '$') {
  if (schema.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${path}: object expected`);
    const out = {};
    for (const k of schema.required || []) if (!(k in value)) throw new Error(`${path}.${k}: missing`);
    for (const [k, sub] of Object.entries(schema.properties || {})) if (k in value) out[k] = conform(value[k], sub, `${path}.${k}`);
    return out;
  }
  if (schema.type === 'array') {
    if (!Array.isArray(value)) throw new Error(`${path}: array expected`);
    if (schema.minItems != null && value.length < schema.minItems) throw new Error(`${path}: too few items`);
    const arr = value.slice(0, schema.maxItems || value.length);
    return arr.map((x, i) => conform(x, schema.items, `${path}[${i}]`));
  }
  if (schema.type === 'string') {
    if (typeof value !== 'string') throw new Error(`${path}: string expected`);
    let s = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
    if (schema.enum && !schema.enum.includes(s)) throw new Error(`${path}: not allowed`);
    if (schema.maxLength && s.length > schema.maxLength) s = s.slice(0, schema.maxLength).replace(/\s\S*$/, '') + '…';
    if (schema.minLength && s.length < schema.minLength) throw new Error(`${path}: too short`);
    return s;
  }
  if (schema.type === 'integer' || schema.type === 'number') { if (typeof value !== 'number' || !isFinite(value)) throw new Error(`${path}: number expected`); return value; }
  if (schema.type === 'boolean') return !!value;
  throw new Error(`${path}: unknown schema`);
}
