// Validação de email no cliente — espelho EXATO da regex do servidor
// (app/api/subscribe/route.ts). O servidor continua validando (defesa real);
// aqui é UX: erro específico perto do campo em vez do 400 genérico.
// O <input type="email"> do browser aceita "nome@gmail" sem TLD, que o
// servidor rejeita; este helper pega o caso antes do fetch.
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Devolve a mensagem de erro pro campo, ou null se o email passa.
export function emailError(raw: string): string | null {
  const email = raw.trim();
  if (!email) return "Digite um email válido";
  if (EMAIL_RE.test(email)) return null;
  const dominio = email.split("@")[1];
  if (dominio && !dominio.includes("."))
    return "Confere o final do email (falta o .com?)";
  return "Digite um email válido";
}
