import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/motorista")({
  beforeLoad: ({ location }) => {
    throw redirect({
      to: "/app/motorista",
      search: location.search as any,
    });
  },
  component: () => null,
});
