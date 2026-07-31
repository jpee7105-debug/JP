import type { User, Employee } from "@shared/schema";

/**
 * Safe public-facing user object.
 * Never includes: passwordHash, stripeCustomerId, stripeSubscriptionId, updatedAt.
 * These fields exist in the database schema (preserved for Phase 4 billing)
 * but must not be transmitted to clients.
 */
export type UserDTO = {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  subscriptionStatus: string;
  createdAt: Date;
  lastLoginAt: Date | null;
};

export function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    plan: user.plan,
    subscriptionStatus: user.subscriptionStatus,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt ?? null,
  };
}

/**
 * Safe admin-facing employee object.
 * Never includes: passwordHash, updatedAt.
 */
export type EmployeeDTO = {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
};

export function toEmployeeDTO(employee: Employee): EmployeeDTO {
  return {
    id: employee.id,
    email: employee.email,
    name: employee.name,
    role: employee.role,
    isActive: employee.isActive,
    createdAt: employee.createdAt,
    lastLoginAt: employee.lastLoginAt ?? null,
  };
}
