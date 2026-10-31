import { useContext } from 'react';
import { SystemContext } from './systemContext';

/* === ACESSO AO CONTEXTO DO SISTEMA === */
export function useSystem() {
  const system = useContext(SystemContext);

  if (!system) throw new Error('useSystem deve ser usado dentro de SystemProvider.');

  return system;
}