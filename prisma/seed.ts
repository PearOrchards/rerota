import { prisma as p } from "@/lib/prisma";
import { PermissionAction } from "../generated/prisma/client";
import { Business, Category, Competency, NumberMatrix, Position, Ride, StaffMember, Tier } from ".prisma/client/client";

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

const business: Omit<Business, "id"> = {
	name: "Pawel's Theme Park",
	slug: "theme_park",
};

const staff: Omit<StaffMember, "createdAt" | "updatedAt" | "businessId">[] = [
	{
		id: "1",
		firstName: "Pawel",
		lastName: "Kedzia",
	},
	{
		id: "2",
		firstName: "Ethan",
		lastName: "Potter",
	},
	{
		id: "3",
		firstName: "Archie",
		lastName: "Hardly",
	},
	{
		id: "4",
		firstName: "Farhan",
		lastName: "Rahman",
	},
	{
		id: "5",
		firstName: "Harry",
		lastName: "Harry",
	},
];

const category: Category[] = [
	{
		id: "1",
		name: "Training Required",
	},
	{
		id: "2",
		name: "Training Break until Lost",
	},
	{
		id: "3",
		name: "Competency Break until Lost",
	},
	{
		id: "4",
		name: "Competency until Trainer",
	},
];

const tiers: Tier[] = [
	{
		id: "1",
		name: "Tier 1",
	},
	{
		id: "2",
		name: "Tier 2",
	},
	{
		id: "3",
		name: "Tier 3",
	},
	{
		id: "4",
		name: "Tier 4",
	},
];

const positions: Position[] = [
	{
		id: "1",
		name: "Attendant",
	},
	{
		id: "2",
		name: "Operator",
	},
];

const matrix: NumberMatrix[] = [
	// Tier 1 - Attendant (positionId: "1")
	{
		tierId: "1",
		positionId: "1",
		categoryId: "1",
		time: 5, // trainingDuration (hours)
	},
	{
		tierId: "1",
		positionId: "1",
		categoryId: "2",
		time: 15, // trainingExpiry (days)
	},
	{
		tierId: "1",
		positionId: "1",
		categoryId: "3",
		time: 60, // competencyExpiry (days)
	},
	{
		tierId: "1",
		positionId: "1",
		categoryId: "4",
		time: 60, // competencyToTrainDuration (days)
	},
	// Tier 1 - Operator (positionId: "2")
	{
		tierId: "1",
		positionId: "2",
		categoryId: "1",
		time: 5, // trainingDuration (hours)
	},
	{
		tierId: "1",
		positionId: "2",
		categoryId: "2",
		time: 15, // trainingExpiry (days)
	},
	{
		tierId: "1",
		positionId: "2",
		categoryId: "3",
		time: 60, // competencyExpiry (days)
	},
	{
		tierId: "1",
		positionId: "2",
		categoryId: "4",
		time: 120, // competencyToTrainDuration (days)
	},
	// Tier 2 - Attendant (positionId: "1")
	{
		tierId: "2",
		positionId: "1",
		categoryId: "1",
		time: 5, // trainingDuration (hours)
	},
	{
		tierId: "2",
		positionId: "1",
		categoryId: "2",
		time: 15, // trainingExpiry (days)
	},
	{
		tierId: "2",
		positionId: "1",
		categoryId: "3",
		time: 60, // competencyExpiry (days)
	},
	{
		tierId: "2",
		positionId: "1",
		categoryId: "4",
		time: 120, // competencyToTrainDuration (days)
	},
	// Tier 2 - Operator (positionId: "2")
	{
		tierId: "2",
		positionId: "2",
		categoryId: "1",
		time: 10, // trainingDuration (hours)
	},
	{
		tierId: "2",
		positionId: "2",
		categoryId: "2",
		time: 10, // trainingExpiry (days)
	},
	{
		tierId: "2",
		positionId: "2",
		categoryId: "3",
		time: 45, // competencyExpiry (days)
	},
	{
		tierId: "2",
		positionId: "2",
		categoryId: "4",
		time: 150, // competencyToTrainDuration (days)
	},
	// Tier 3 - Attendant (positionId: "1")
	{
		tierId: "3",
		positionId: "1",
		categoryId: "1",
		time: 10, // trainingDuration (hours)
	},
	{
		tierId: "3",
		positionId: "1",
		categoryId: "2",
		time: 10, // trainingExpiry (days)
	},
	{
		tierId: "3",
		positionId: "1",
		categoryId: "3",
		time: 45, // competencyExpiry (days)
	},
	{
		tierId: "3",
		positionId: "1",
		categoryId: "4",
		time: 150, // competencyToTrainDuration (days)
	},
	// Tier 3 - Operator (positionId: "2")
	{
		tierId: "3",
		positionId: "2",
		categoryId: "1",
		time: 15, // trainingDuration (hours)
	},
	{
		tierId: "3",
		positionId: "2",
		categoryId: "2",
		time: 10, // trainingExpiry (days)
	},
	{
		tierId: "3",
		positionId: "2",
		categoryId: "3",
		time: 30, // competencyExpiry (days)
	},
	{
		tierId: "3",
		positionId: "2",
		categoryId: "4",
		time: 180, // competencyToTrainDuration (days)
	},
	// Tier 4 - Attendant (positionId: "1")
	{
		tierId: "4",
		positionId: "1",
		categoryId: "1",
		time: 15, // trainingDuration (hours)
	},
	{
		tierId: "4",
		positionId: "1",
		categoryId: "2",
		time: 10, // trainingExpiry (days)
	},
	{
		tierId: "4",
		positionId: "1",
		categoryId: "3",
		time: 30, // competencyExpiry (days)
	},
	{
		tierId: "4",
		positionId: "1",
		categoryId: "4",
		time: 180, // competencyToTrainDuration (days)
	},
	// Tier 4 - Operator (positionId: "2")
	{
		tierId: "4",
		positionId: "2",
		categoryId: "1",
		time: 20, // trainingDuration (hours)
	},
	{
		tierId: "4",
		positionId: "2",
		categoryId: "2",
		time: 7, // trainingExpiry (days)
	},
	{
		tierId: "4",
		positionId: "2",
		categoryId: "3",
		time: 20, // competencyExpiry (days)
	},
	{
		tierId: "4",
		positionId: "2",
		categoryId: "4",
		time: 240, // competencyToTrainDuration (days)
	},
];

const rides: Ride[] = [
	{
		id: "1",
		name: "The Triangle",
		description: "The point of the UK.",
		tierId: "4",
	},
	{
		id: "2",
		name: "The Square",
		description: "This description has a really long description which would have no way of fitting normally, so it gets cut. RIP.",
		tierId: "4",
	},
	{
		id: "3",
		name: "The Circle",
		description: "Round and round we go.",
		tierId: "3",
	},
	{
		id: "4",
		name: "The Rectangle",
		description: "Not quite The Square.",
		tierId: "2",
	},
	{
		id: "5",
		name: "The Pentagon",
		description: "Five sides of fun.",
		tierId: "1",
	},
];

const competencies: Competency[] = [
	// Pawel (has 3 rides: Triangle, Circle, Square)
	{
		staffMemberId: "1",
		rideId: "1",
		positionId: "2",
		achievedAt: new Date("2025-12-31"),
		last_rotatedAt: new Date("2026-01-15"),
	},
	{
		staffMemberId: "1",
		rideId: "1",
		positionId: "1",
		achievedAt: new Date("2025-12-28"),
		last_rotatedAt: new Date("2026-01-10"),
	},
	{
		staffMemberId: "1",
		rideId: "3",
		positionId: "2",
		achievedAt: new Date("2025-11-15"),
		last_rotatedAt: new Date("2026-01-05"),
	},
	{
		staffMemberId: "1",
		rideId: "3",
		positionId: "1",
		achievedAt: new Date("2025-11-10"),
		last_rotatedAt: new Date("2026-01-02"),
	},
	{
		staffMemberId: "1",
		rideId: "2",
		positionId: "2",
		achievedAt: new Date("2026-01-01"),
		last_rotatedAt: new Date("2026-01-28"),
	},
	{
		staffMemberId: "1",
		rideId: "2",
		positionId: "1",
		achievedAt: new Date("2025-12-20"),
		last_rotatedAt: new Date("2026-01-25"),
	},

	// Ethan (has 3 rides: Square, Rectangle, Circle)
	{
		staffMemberId: "2",
		rideId: "2",
		positionId: "2",
		achievedAt: new Date("2025-12-05"),
		last_rotatedAt: new Date("2026-01-25"),
	},
	{
		staffMemberId: "2",
		rideId: "2",
		positionId: "1",
		achievedAt: new Date("2025-11-30"),
		last_rotatedAt: new Date("2026-01-20"),
	},
	{
		staffMemberId: "2",
		rideId: "4",
		positionId: "2",
		achievedAt: new Date("2025-09-25"),
		last_rotatedAt: new Date("2025-11-30"),
	},
	{
		staffMemberId: "2",
		rideId: "4",
		positionId: "1",
		achievedAt: new Date("2025-09-20"),
		last_rotatedAt: new Date("2025-11-25"),
	},
	{
		staffMemberId: "2",
		rideId: "3",
		positionId: "2",
		achievedAt: new Date("2025-11-20"),
		last_rotatedAt: new Date("2026-01-10"),
	},
	{
		staffMemberId: "2",
		rideId: "3",
		positionId: "1",
		achievedAt: new Date("2025-11-15"),
		last_rotatedAt: new Date("2026-01-08"),
	},
	// Archie (has 3 rides: Triangle, Circle, Rectangle)
	{
		staffMemberId: "3",
		rideId: "1",
		positionId: "2",
		achievedAt: new Date("2026-01-10"),
		last_rotatedAt: null,
	},
	{
		staffMemberId: "3",
		rideId: "1",
		positionId: "1",
		achievedAt: new Date("2026-01-08"),
		last_rotatedAt: null,
	},
	{
		staffMemberId: "3",
		rideId: "3",
		positionId: "2",
		achievedAt: new Date("2025-10-31"),
		last_rotatedAt: new Date("2026-01-12"),
	},
	{
		staffMemberId: "3",
		rideId: "3",
		positionId: "1",
		achievedAt: new Date("2025-10-25"),
		last_rotatedAt: new Date("2026-01-08"),
	},
	{
		staffMemberId: "3",
		rideId: "4",
		positionId: "2",
		achievedAt: new Date("2025-09-15"),
		last_rotatedAt: new Date("2025-12-20"),
	},
	{
		staffMemberId: "3",
		rideId: "4",
		positionId: "1",
		achievedAt: new Date("2025-09-10"),
		last_rotatedAt: new Date("2025-12-15"),
	},
	// Farhan (has 3 rides: Pentagon, Rectangle, Circle)
	{
		staffMemberId: "4",
		rideId: "5",
		positionId: "2",
		achievedAt: new Date("2025-08-10"),
		last_rotatedAt: new Date("2025-11-15"),
	},
	{
		staffMemberId: "4",
		rideId: "5",
		positionId: "1",
		achievedAt: new Date("2025-08-05"),
		last_rotatedAt: new Date("2025-11-10"),
	},
	{
		staffMemberId: "4",
		rideId: "4",
		positionId: "2",
		achievedAt: new Date("2025-12-01"),
		last_rotatedAt: new Date("2026-01-18"),
	},
	{
		staffMemberId: "4",
		rideId: "4",
		positionId: "1",
		achievedAt: new Date("2025-11-25"),
		last_rotatedAt: new Date("2026-01-15"),
	},
	{
		staffMemberId: "4",
		rideId: "3",
		positionId: "2",
		achievedAt: new Date("2025-12-10"),
		last_rotatedAt: new Date("2026-01-20"),
	},
	{
		staffMemberId: "4",
		rideId: "3",
		positionId: "1",
		achievedAt: new Date("2025-12-05"),
		last_rotatedAt: new Date("2026-01-18"),
	},

	// Harry (has 1 ride: Pentagon Attendant only)
	{
		staffMemberId: "5",
		rideId: "5",
		positionId: "1",
		achievedAt: new Date("2025-07-20"),
		last_rotatedAt: new Date("2025-10-25"),
	},
];

async function main() {
	console.log("PERMISSIONS...");
	for (const permission of permissions) {
		await p.permission.upsert({
			where: { slug: permission.slug },
			update: {},
			create: permission,
		});
	}

	console.log("ROLES...");
	for (const role of roles) {
		const permissionConnect = (role.permissions ?? []).map((slug: string) => ({ slug }));
		await p.role.upsert({
			where: { name: role.name },
			update: {
				permissions: {
					set: permissionConnect,
				},
			},
			create: {
				name: role.name,
				permissions: {
					connect: permissionConnect,
				},
			},
		});
	}

	console.log("BUSINESS...");
	const bis = await p.business.upsert({
		where: { slug: business.slug },
		update: business,
		create: business,
	});

	console.log("STAFF MEMBERS...");
	for (const person of staff) {
		await p.staffMember.upsert({
			where: { id: person.id },
			create: {
				businessId: bis.id,
				...person,
			},
			update: {
				businessId: bis.id,
				...person,
			},
		});
	}

	console.log("MATRIX COMPONENTS...");
	for (const cat of category) {
		await p.category.upsert({
			where: { id: cat.id },
			update: cat,
			create: cat,
		});
	}

	for (const tier of tiers) {
		await p.tier.upsert({
			where: { id: tier.id },
			update: tier,
			create: tier,
		});
	}

	for (const position of positions) {
		await p.position.upsert({
			where: { id: position.id },
			update: position,
			create: position,
		});
	}

	console.log("NUMBER MATRIX...");
	for (const entry of matrix) {
		await p.numberMatrix.upsert({
			where: {
				tierId_positionId_categoryId: {
					tierId: entry.tierId,
					positionId: entry.positionId,
					categoryId: entry.categoryId,
				},
			},
			update: { time: entry.time },
			create: entry,
		});
	}

	console.log("RIDES...");
	for (const ride of rides) {
		await p.ride.upsert({
			where: { id: ride.id },
			update: ride,
			create: ride,
		});
	}

	console.log("COMPETENCIES...");
	for (const competency of competencies) {
		await p.competency.upsert({
			where: {
				staffMemberId_rideId_positionId: {
					staffMemberId: competency.staffMemberId,
					rideId: competency.rideId,
					positionId: competency.positionId,
				},
			},
			update: {
				achievedAt: competency.achievedAt,
				last_rotatedAt: competency.last_rotatedAt,
			},
			create: competency,
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