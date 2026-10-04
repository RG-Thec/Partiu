import { createFileRoute } from "@tanstack/react-router";
import { PartiuAppAuthGate } from "@/components/auth/PartiuAppAuthGate";

function rotaSegura(valor: unknown): string | undefined {
  const v = typeof valor === "string" ? valor : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : undefined;
}

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => {
    const redirect = rotaSegura(search["redirect"]);
    const roleParam =
      search["role"] === "MOTORISTA" || search["role"] === "PASSAGEIRO"
        ? (search["role"] as "PASSAGEIRO" | "MOTORISTA")
        : undefined;
    return {
      ...(redirect ? { redirect } : {}),
      ...(roleParam ? { role: roleParam } : {}),
      ...(search["expirada"] === "1" ? { expirada: "1" as const } : {}),
    };
  },

  head: () => ({
    meta: [
      { title: "Entrar ou Cadastrar | PARTIU" },
      {
        name: "description",
        content:
          "Para onde você for, Partiu! Acesse sua conta PARTIU com celular ou e-mail para solicitar corridas de carro, moto e entregas expressas com segurança.",
      },
      { property: "og:title", content: "Entrar | PARTIU Mobilidade" },
      {
        property: "og:description",
        content: "Carro, moto e entregas em minutos com tarifa justa e acompanhamento em tempo real.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AuthPagePartiu,
});

export function AuthPagePartiu() {
  const { redirect, role } = Route.useSearch();
  return <PartiuAppAuthGate redirectDestination={redirect} initialRole={role} />;
}
