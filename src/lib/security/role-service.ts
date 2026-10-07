/**
 * PARTIU TITANIUM SHIELD — ENTERPRISE ROLE & PERMISSION SERVICE
 * 
 * Implementação do modelo de 7 Níveis Hierárquicos de RBAC:
 * - OWNER: Acesso irrestrito a governança, ledger, split bancário e tesouraria.
 * - SUPER_ADMIN: Gestão operacional nacional, configurações globais e segurança.
 * - FRANCHISE_ADMIN: Gestão municipal/regional isolada de sua praça outorgada.
 * - CORPORATE_ADMIN: Gestão de contas B2B, centros de custos e aprovações.
 * - OPERATOR: Monitoramento de tráfego, despacho de frotas e suporte SOS.
 * - DRIVER: Acesso ao cockpit operacional, rota, recebimento D+0 e wallet.
 * - PASSENGER: Acesso à solicitação de viagens, encomendas e PARTIU Pay.
 */

import { AdminRole, AdminPermission } from './auth-service';

export { type AdminRole, type AdminPermission } from './auth-service';

export interface RoleDefinition {
  role: AdminRole;
  title: string;
  description: string;
  level: number;
  permissions: AdminPermission[];
}

const ALL_PERMISSIONS: AdminPermission[] = [
  'financial:view_revenue',
  'financial:view_profit',
  'financial:view_splits',
  'financial:manage_cash_closing',
  'financial:configure_gateways',
  'financial:configure_fees',
  'financial:process_refunds',
  'financial:export_ledger',
  'governance:manage_admins',
  'governance:manage_permissions',
  'governance:view_audit_logs',
  'governance:edit_security_rules',
  'operations:view_radar',
  'operations:manage_sos',
  'operations:manage_trips',
  'operations:manage_routes',
  'operations:manage_stops',
  'operations:manage_fleet',
  'operations:manage_drivers',
  'operations:manage_passengers',
  'operations:manage_cargo',
  'operations:view_operational_kpis',
  'app:manage_banners',
  'app:manage_announcements',
  'app:manage_affiliates',
  'app:configure_system_parameters'
];

export const ROLE_DEFINITIONS: Record<AdminRole, RoleDefinition> = {
  SUPER_ADMIN: {
    role: 'SUPER_ADMIN',
    title: 'Super Administrador (Acesso Total)',
    description: 'Acesso irrestrito a governança nacional, múltiplos tenants, ledger contábil, split financeiro e configurações avançadas.',
    level: 100,
    permissions: [...ALL_PERMISSIONS]
  },
  FRANQUEADO: {
    role: 'FRANQUEADO',
    title: 'Franqueado (Acesso Local)',
    description: 'Gestão isolada e restrita estritamente ao seu próprio tenant (praça municipal, frota local e corridas da região).',
    level: 60,
    permissions: [
      'operations:view_radar',
      'operations:manage_sos',
      'operations:manage_trips',
      'operations:manage_routes',
      'operations:manage_stops',
      'operations:manage_fleet',
      'operations:manage_drivers',
      'operations:manage_passengers',
      'operations:manage_cargo',
      'operations:view_operational_kpis',
      'financial:view_revenue',
      'financial:view_splits',
      'app:manage_banners'
    ]
  }
};

export class RoleService {
  /**
   * Verifica se determinado papel possui uma permissão específica
   */
  public static hasPermission(role: AdminRole, permission: AdminPermission): boolean {
    const def = ROLE_DEFINITIONS[role];
    if (!def) return false;
    return def.permissions.includes(permission);
  }

  /**
   * Verifica se o papel possui nível hierárquico igual ou superior ao necessário
   */
  public static isAtLeast(currentRole: AdminRole, requiredRole: AdminRole): boolean {
    const current = ROLE_DEFINITIONS[currentRole]?.level || 0;
    const required = ROLE_DEFINITIONS[requiredRole]?.level || 0;
    return current >= required;
  }

  /**
   * Retorna metadados completos do perfil
   */
  public static getDefinition(role: AdminRole): RoleDefinition {
    return ROLE_DEFINITIONS[role] || ROLE_DEFINITIONS.FRANQUEADO;
  }
}
