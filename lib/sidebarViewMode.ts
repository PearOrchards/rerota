import { roleAllows } from "@/lib/auth/roles";

export type SidebarViewMode = "manager" | "leader";
export type SidebarMode = SidebarViewMode | "staff";

export const SIDEBAR_VIEW_MODE_COOKIE_NAME = "sidebar_view_mode";
export const SIDEBAR_VIEW_MODE_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function canSwitchSidebarView(roleName: string | null): boolean {
	return !!roleName && roleAllows(roleName, "Manager");
}

export function parseSidebarViewMode(
	value: string | null | undefined,
): SidebarViewMode | null {
	if (value === "manager" || value === "leader") {
		return value;
	}
	return null;
}

export function resolveManagerSidebarViewMode(
	preferredMode?: string | null,
): SidebarViewMode {
	return parseSidebarViewMode(preferredMode) ?? "manager";
}

export function resolveSidebarMode(
	roleName: string | null,
	preferredMode?: string | null,
): SidebarMode {
	if (canSwitchSidebarView(roleName)) {
		return resolveManagerSidebarViewMode(preferredMode);
	}

	if (roleName === "Team Leader") {
		return "leader";
	}

	return "staff";
}
