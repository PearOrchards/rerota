import { prisma as p } from "@/lib/prisma";
import { PermissionAction } from "../generated/prisma/client";

const permissionResources = [
	"staffMember",
	"business",
	"tier",
	"position",
	"numberMatrix",
	"ride",
	"competency",
];
const permissionActions: PermissionAction[] = ["CREATE", "READ", "UPDATE", "DELETE"];
const permissions = permissionResources.map(resource => {
	return permissionActions.map(action => {
		return {
			slug: `${resource}:${action}`,
			resource,
			action,
		};
	}).flat();
}).flat();

const roles = [
	{
		name: "Admin", permissions: permissions.map(perm => perm.slug),
	},
	{
		name: "Manager", permissions: [
			"staffMember:CREATE", "staffMember:READ", "staffMember:UPDATE", "staffMember:DELETE",
			"business:READ", "business:UPDATE",
			"tier:CREATE", "tier:READ", "tier:UPDATE", "tier:DELETE",
			"position:CREATE", "position:READ", "position:UPDATE", "position:DELETE",
			"numberMatrix:CREATE", "numberMatrix:READ", "numberMatrix:UPDATE", "numberMatrix:DELETE",
			"ride:CREATE", "ride:READ", "ride:UPDATE", "ride:DELETE",
			"competency:CREATE", "competency:READ", "competency:UPDATE", "competency:DELETE",
		],
	},
	{
		name: "Team Leader", permissions: [
			"staffMember:READ",
			"business:READ",
			"tier:READ",
			"position:READ",
			"numberMatrix:READ",
			"ride:READ",
			"competency:CREATE", "competency:READ", "competency:UPDATE", "competency:DELETE",
		],
	},
	// Not including basic staff for now
];

async function main() {
	for (const permission of permissions) {
		await p.permission.upsert({
			where: { slug: permission.slug },
			update: {},
			create: permission,
		});
	}

	for (const role of roles) {
		await p.role.upsert({
			where: { name: role.name },
			update: {},
			create: role,
		});
	}
}

main()
	.then(async () => await p.$disconnect())
	.catch(async err => {
		console.error(err);
		await p.$disconnect();
		process.exit(1);
	});