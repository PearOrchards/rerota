import { prisma as p } from "@/lib/prisma";
import {
	PermissionAction,
	Business,
	Category,
	Competency,
	NumberMatrix,
	Position,
	Ride,
	StaffMember,
	Tier,
} from "../generated/prisma/client";

const UTC_SEED_HOUR = 12;
const daysAgo = (days: number): Date => {
	const now = new Date();
	return new Date(Date.UTC(
		now.getUTCFullYear(),
		now.getUTCMonth(),
		now.getUTCDate() - days,
		UTC_SEED_HOUR,
	));
};

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
	{
		name: "Staff", permissions: [
			"staffMember:READ",
			"business:READ",
			"tier:READ",
			"position:READ",
			"numberMatrix:READ",
			"ride:READ",
			"competency:READ",
		],
	},
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
	{
		id: "6",
		firstName: "Lauren",
		lastName: "Allen",
	},
	{
		id: "7",
		firstName: "Mason",
		lastName: "Clarke",
	},
	{
		id: "8",
		firstName: "Nia",
		lastName: "Patel",
	},
	{
		id: "9",
		firstName: "Lucas",
		lastName: "Bennett",
	},
	{
		id: "10",
		firstName: "Zoe",
		lastName: "Carter",
	},
];

const category: Omit<Category, "businessId">[] = [
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

const tiers: Omit<Tier, "businessId">[] = [
	{
		id: "1",
		name: "Tier 1",
		order: 1,
	},
	{
		id: "2",
		name: "Tier 2",
		order: 2,
	},
	{
		id: "3",
		name: "Tier 3",
		order: 3,
	},
	{
		id: "4",
		name: "Tier 4",
		order: 4,
	},
];

const positions: Omit<Position, "businessId">[] = [
	{
		id: "1",
		name: "Attendant",
		order: 1,
	},
	{
		id: "2",
		name: "Operator",
		order: 2,
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

const rides: (Omit<Ride, "businessId"> & { positionIds: string[] })[] = [
	{
		id: "1",
		name: "The Triangle",
		description: "The point of the UK.",
		tierId: "4",
		positionIds: ["1", "2"],
	},
	{
		id: "2",
		name: "The Square",
		description: "This description has a really long description which would have no way of fitting normally, so it gets cut. RIP.",
		tierId: "4",
		positionIds: ["1", "2"],
	},
	{
		id: "3",
		name: "The Circle",
		description: "Round and round we go.",
		tierId: "3",
		positionIds: ["1", "2"],
	},
	{
		id: "4",
		name: "The Rectangle",
		description: "Not quite The Square.",
		tierId: "2",
		positionIds: ["1", "2"],
	},
	{
		id: "5",
		name: "The Pentagon",
		description: "Five sides of fun.",
		tierId: "1",
		positionIds: ["1"],
	},
];

const seedCompetency = (
	staffMemberId: string,
	rideId: string,
	positionId: string,
	achievedDaysAgo: number,
	lastRotatedDaysAgo: number | null,
): Competency => ({
	staffMemberId,
	rideId,
	positionId,
	achievedAt: daysAgo(achievedDaysAgo),
	last_rotatedAt: lastRotatedDaysAgo === null ? null : daysAgo(lastRotatedDaysAgo),
});

const competencies: Competency[] = [
	// Pawel (has 3 rides: Triangle, Circle, Square)
	seedCompetency("1", "1", "2", 18, 9),
	seedCompetency("1", "1", "1", 19, 8),
	seedCompetency("1", "3", "2", 25, 12),
	seedCompetency("1", "3", "1", 29, 13),
	seedCompetency("1", "2", "2", 16, 6),
	seedCompetency("1", "2", "1", 17, 5),

	// Ethan (has 3 rides: Square, Rectangle, Circle)
	seedCompetency("2", "2", "2", 21, 11),
	seedCompetency("2", "2", "1", 24, 10),
	seedCompetency("2", "4", "2", 58, 52), // expired
	seedCompetency("2", "4", "1", 44, 18),
	seedCompetency("2", "3", "2", 27, 15),
	seedCompetency("2", "3", "1", 28, 14),

	// Archie (has 3 rides: Triangle, Circle, Rectangle)
	seedCompetency("3", "1", "2", 12, null),
	seedCompetency("3", "1", "1", 14, null),
	seedCompetency("3", "3", "2", 30, 16),
	seedCompetency("3", "3", "1", 31, 17),
	seedCompetency("3", "4", "2", 34, 20),
	seedCompetency("3", "4", "1", 35, 19),

	// Farhan (has 3 rides: Pentagon, Rectangle, Circle)
	seedCompetency("4", "5", "2", 36, 23),
	seedCompetency("4", "5", "1", 37, 22),
	seedCompetency("4", "4", "2", 26, 12),
	seedCompetency("4", "4", "1", 27, 13),
	seedCompetency("4", "3", "2", 22, 9),
	seedCompetency("4", "3", "1", 24, 73), // expired

	// Harry (has 1 ride: Pentagon Attendant only)
	seedCompetency("5", "5", "1", 75, 9),

	// Olivia (has 3 rides: Triangle, Square, Rectangle)
	seedCompetency("6", "1", "2", 20, 7),
	seedCompetency("6", "1", "1", 21, 8),
	seedCompetency("6", "2", "2", 24, 10),
	seedCompetency("6", "2", "1", 25, 11),
	seedCompetency("6", "4", "2", 33, 15),
	seedCompetency("6", "4", "1", 34, 16),

	// Mason (has 3 rides: Circle, Rectangle, Pentagon)
	seedCompetency("7", "3", "2", 19, 6),
	seedCompetency("7", "3", "1", 20, 7),
	seedCompetency("7", "4", "2", 31, 14),
	seedCompetency("7", "4", "1", 32, 15),
	seedCompetency("7", "5", "1", 28, null),

	// Nia (has 3 rides: Triangle, Circle, Pentagon)
	seedCompetency("8", "1", "2", 17, null),
	seedCompetency("8", "1", "1", 18, null),
	seedCompetency("8", "3", "2", 26, 12),
	seedCompetency("8", "3", "1", 27, 13),
	seedCompetency("8", "5", "1", 23, 9),

	// Lucas (has 3 rides: Square, Rectangle, Pentagon)
	seedCompetency("9", "2", "2", 18, 5),
	seedCompetency("9", "2", "1", 19, 6),
	seedCompetency("9", "4", "2", 29, 12),
	seedCompetency("9", "4", "1", 30, 13),
	seedCompetency("9", "5", "1", 21, 8),

	// Zoe (has 3 rides: Triangle, Circle, Rectangle)
	seedCompetency("10", "1", "2", 15, 4),
	seedCompetency("10", "1", "1", 16, 5),
	seedCompetency("10", "3", "2", 23, 9),
	seedCompetency("10", "3", "1", 24, 10),
	seedCompetency("10", "4", "1", 28, 11),
];

async function main() {
	console.log("PERMISSIONS...");
	for (const permission of permissions) {
		await p.permission.upsert({
			where: { slug: permission.slug },
			update: {
				resource: permission.resource,
				action: permission.action,
			},
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
			update: { ...cat, businessId: bis.id },
			create: { ...cat, businessId: bis.id },
		});
	}

	for (const tier of tiers) {
		await p.tier.upsert({
			where: { id: tier.id },
			update: { ...tier, businessId: bis.id },
			create: { ...tier, businessId: bis.id },
		});
	}

	for (const position of positions) {
		await p.position.upsert({
			where: { id: position.id },
			update: { ...position, businessId: bis.id },
			create: { ...position, businessId: bis.id },
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
		const { positionIds, ...rideData } = ride;
		await p.ride.upsert({
			where: { id: ride.id },
			update: {
				...rideData,
				businessId: bis.id,
				ridePositions: {
					deleteMany: {},
					create: positionIds.map(id => ({
						positionId: id,
						quantity: 1,
					})),
				},
			},
			create: {
				...rideData,
				businessId: bis.id,
				ridePositions: {
					create: positionIds.map(id => ({
						positionId: id,
						quantity: 1,
					})),
				},
			},
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
