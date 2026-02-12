const roleRank: Record<string, number> = {
	"Staff": 1,
	"Team Leader": 2,
	"Manager": 3,
	"Admin": 4,
};

export function roleAllows(userRole: string, requiredRole?: string | null): boolean {
	if (!requiredRole) {
		return true;
	}
	if (userRole === "Admin") {
		return true;
	}
	return (roleRank[userRole] ?? 0) >= (roleRank[requiredRole] ?? 0);
}

export function requiredRoleForPath(pathname: string): string | null {
	const roleByPrefix: Array<{ prefix: string; role: string }> = [
		{ prefix: "/rides", role: "Manager" },
		{ prefix: "/business", role: "Manager" },
		{ prefix: "/numbers", role: "Manager" },
		{ prefix: "/staff", role: "Manager" },
		{ prefix: "/settings", role: "Staff" },
	];

	for (const entry of roleByPrefix) {
		if (pathname.startsWith(entry.prefix)) {
			return entry.role;
		}
	}
	return null;
}
