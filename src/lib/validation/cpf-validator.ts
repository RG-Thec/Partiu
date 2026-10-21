/**
 * PARTIU MOBILIDADE URBANA & ENTREGAS
 * Validador Oficial de CPF Brasileiro (Algoritmo da Receita Federal)
 * 
 * Invariantes:
 * 1. Exatamente 11 dígitos numéricos após sanitização.
 * 2. Rejeição imediata de sequências com todos os dígitos repetidos (ex: 111.111.111-11).
 * 3. Cálculo rigoroso do 1º e 2º dígitos verificadores (módulo 11).
 */

export function sanitizarCpf(cpf: string | null | undefined): string {
  if (!cpf) return "";
  return cpf.replace(/\D/g, "").slice(0, 11);
}

export function validarCpf(cpf: string | null | undefined): boolean {
  if (!cpf) return false;
  const limpo = sanitizarCpf(cpf);
  if (limpo.length !== 11) return false;

  // Rejeita números com todos os dígitos iguais (ex: 00000000000, 11111111111...)
  if (/^(\d)\1{10}$/.test(limpo)) return false;

  // Validação do primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(limpo.charAt(i), 10) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.charAt(9), 10)) return false;

  // Validação do segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(limpo.charAt(i), 10) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(limpo.charAt(10), 10);
}

export function formatarCpf(val: string | null | undefined): string {
  const raw = sanitizarCpf(val);
  if (raw.length <= 3) return raw;
  if (raw.length <= 6) return `${raw.slice(0, 3)}.${raw.slice(3)}`;
  if (raw.length <= 9) return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`;
  return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9)}`;
}
