import type { Metadata } from "next";
import PageBeacon from "../PageBeacon";
import CadastroLP from "./CadastroLP";

export const metadata: Metadata = {
  title: "Notas do Café · Receba todo dia",
  description: "Às 08:08 na sua caixa: o grão, o preparo e o equipamento certo pra tirar mais da sua próxima xícara. Sem frescura, com origem.",
};

export default function Cadastro() {
  return (
    <>
      <PageBeacon slug="notas-do-cafe" step="topo" source="cadastro" />
      <CadastroLP />
    </>
  );
}
