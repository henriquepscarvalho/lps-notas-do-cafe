"use client";

import { useEffect } from "react";

// dmo/08 (25/09/26): cadastro em 1 toque pelo card «Quero receber» do bloco de recomendação das
// edições. O link chega com ?email=<o do leitor> (merge tag da beehiiv). O email sai da barra antes
// de qualquer beacon, pixel ou Clarity ler a URL (este efeito roda antes dos irmãos e do layout), e o
// formulário do topo vira um botão Confirmar com o email escrito. Nada é enviado no carregamento (o
// scanner do Gmail abre link): o POST é o submit de sempre do formulário, disparado pelo toque.
// Sem o parâmetro, ou com email inválido (versão web do post, merge tag crua), a página não muda.
// ARQUIVO GERADO: fonte em .wayfinder/dois-motores/assets/UmToque.tsx, rollout_um_toque.py.
const OK = /^[^\s@<>"'&{}()\\,;:]+@[^\s@<>"'&{}()\\,;:]+\.[a-z]{2,}$/i;

export default function UmToque() {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (!q.has("email")) return;
    // "+" do alias chega como espaço quando a beehiiv não codifica o email no link
    const email = (q.get("email") || "").trim().replace(/ /g, "+");
    q.delete("email");
    const qs = q.toString();
    try {
      window.history.replaceState(window.history.state, "", window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash);
    } catch {
      /* sem history, segue sem o botão */
    }
    if (email.length > 254 || !OK.test(email)) return;
    const form =
      document.querySelector<HTMLFormElement>("#lpc-hero-form") ??
      document.querySelector<HTMLInputElement>("form input[type=email]")?.form ??
      null;
    const input = form?.querySelector<HTMLInputElement>("input[type=email]");
    const btn = form?.querySelector<HTMLButtonElement>("button");
    if (!form || !input || !btn) return;
    const campo = input.parentElement && input.parentElement !== form && !input.parentElement.contains(btn) ? input.parentElement : input;
    const rotulo = btn.textContent;
    const largura = btn.style.width;
    input.value = email;
    campo.style.display = "none";
    btn.textContent = "Confirmar";
    btn.style.width = "100%";
    form.setAttribute("data-um-toque", "1");
    // cor e sombra do texto do próprio topo (hero escuro com texto claro, ou o contrário)
    const par = form.closest("section")?.querySelector("p");
    const cs = par ? getComputedStyle(par) : null;
    const tinta = cs ? `color:${cs.color};text-shadow:${cs.textShadow}` : "color:inherit";
    const linha = document.createElement("p");
    linha.className = "umt-linha";
    linha.style.cssText = `margin:0 0 10px;font-size:15px;line-height:1.4;overflow-wrap:anywhere;${tinta}`;
    const b = document.createElement("b");
    b.textContent = email;
    linha.append("Receber no email ", b);
    const outro = document.createElement("a");
    outro.href = "#";
    outro.className = "umt-outro";
    outro.textContent = "Usar outro email";
    outro.style.cssText = `display:inline-block;margin:10px 0 0;font-size:13px;text-decoration:underline;opacity:.85;${tinta}`;
    form.before(linha);
    form.after(outro);
    outro.addEventListener("click", (e) => {
      e.preventDefault();
      linha.remove();
      outro.remove();
      form.removeAttribute("data-um-toque");
      campo.style.display = "";
      btn.style.width = largura;
      btn.textContent = rotulo;
      input.value = "";
      input.focus();
    });
  }, []);
  return null;
}
