import { useState, useEffect, useCallback } from "react";
import {
  getAdminRole,
  setAdminRole,
  getContaAtiva,
  isSuperAdmin as checkIsSuperAdmin,
  isFranqueado as checkIsFranqueado,
  logoutAdmin,
  type AdminRole,
  type AdminAccount,
} from "@/lib/admin-rbac";

export interface UseAdminAuthResult {
  role: AdminRole;
  isSuperAdmin: boolean;
  isFranqueado: boolean;
  tenantId?: string | undefined;
  contaAtiva: AdminAccount;
  trocarRole: (novaRole: AdminRole) => void;
  logout: () => void;
}

/**
 * 🛡️ Hook Reativo para Controle de Acesso no Painel Administrativo (RBAC Purificado)
 * Fornece de forma limpa e binária:
 * - isSuperAdmin (Holding / Matriz: Acesso Total)
 * - isFranqueado (Operador Regional: Acesso restrito ao seu próprio tenant)
 */
export function useAdminAuth(): UseAdminAuthResult {
  const [role, setRoleState] = useState<AdminRole>(() => getAdminRole());
  const [contaAtiva, setContaAtiva] = useState<AdminAccount>(() => getContaAtiva());

  useEffect(() => {
    function handleRoleChanged(e: any) {
      if (e.detail?.role) {
        setRoleState(e.detail.role);
        setContaAtiva(getContaAtiva());
      }
    }

    window.addEventListener("partiu:role-changed", handleRoleChanged);
    return () => {
      window.removeEventListener("partiu:role-changed", handleRoleChanged);
    };
  }, []);

  const trocarRole = useCallback((novaRole: AdminRole) => {
    setAdminRole(novaRole);
    setRoleState(novaRole);
    setContaAtiva(getContaAtiva());
  }, []);

  const logout = useCallback(() => {
    logoutAdmin();
  }, []);

  const isSuperAdmin = checkIsSuperAdmin(role);
  const isFranqueado = checkIsFranqueado(role);

  return {
    role,
    isSuperAdmin,
    isFranqueado,
    tenantId: contaAtiva.tenantId,
    contaAtiva,
    trocarRole,
    logout,
  };
}
