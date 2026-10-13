import { useState, useEffect, useCallback } from "react";
import {
  getAdminRole,
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
  logout: () => void;
}

/**
 * 🛡️ Hook Reativo para Controle de Acesso no Painel Administrativo (RBAC Purificado)
 * Fornece de forma limpa e binária:
 * - isSuperAdmin (Holding / Matriz: Acesso Total)
 * - isFranqueado (Operador Regional: Acesso restrito ao seu próprio tenant)
 * O perfil é estritamente derivado da sessão autenticada do usuário (Super Admin ou Franqueado).
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

    function handleAccountUpdated() {
      setRoleState(getAdminRole());
      setContaAtiva(getContaAtiva());
    }

    window.addEventListener("partiu:role-changed", handleRoleChanged);
    window.addEventListener("partiu:account-updated", handleAccountUpdated);
    return () => {
      window.removeEventListener("partiu:role-changed", handleRoleChanged);
      window.removeEventListener("partiu:account-updated", handleAccountUpdated);
    };
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
    logout,
  };
}
