import Link from "next/link";
import { notFound } from "next/navigation";
import { RotaStatus } from "@/generated/prisma/client";
import { getRotaById } from "@/lib/actions/rotas";
import { getPositions } from "@/lib/actions/positions";
import { getRides } from "@/lib/actions/rides";
import { getStaff } from "@/lib/actions/staff";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import ActivateRotaButton from "./ActivateRotaButton";

type PageProps = {
  params: Promise<{ id: string }>;
};

const getRidePositionKey = (rideId: string, positionId: string) =>
	`${rideId}:${positionId}`;

export default async function ViewRotaPage({ params }: PageProps) {
	const { id } = await params;
	const [rota, positions, rides, staff] = await Promise.all([
		getRotaById(id),
		getPositions(),
		getRides(),
		getStaff(),
	]);

	if (!rota) {
		notFound();
	}

	const sortedPositions = positions.toSorted((left, right) =>
		left.name.localeCompare(right.name),
	);
	const sortedRides = rides
		.map((ride) => {
			const positionQuantities = Object.fromEntries(
				ride.ridePositions.map((ridePosition) => [
					ridePosition.positionId,
					ridePosition.quantity,
				]),
			);
			const totalSlots = ride.ridePositions.reduce(
				(sum, ridePosition) => sum + ridePosition.quantity,
				0,
			);

			return {
				id: ride.id,
				name: ride.name,
				tierName: ride.tier.name,
				positionQuantities,
				totalSlots,
			};
		})
		.toSorted((left, right) => left.name.localeCompare(right.name));

	const staffNameById = new Map(
		staff.map((member) => [
			member.id,
			`${member.firstName} ${member.lastName}`,
		]),
	);

	const assignmentsByRidePosition = rota.details.reduce<Map<string, string[]>>(
		(map, detail) => {
			const key = getRidePositionKey(detail.rideId, detail.positionId);
			const existing = map.get(key) ?? [];
			map.set(key, [...existing, detail.staffMemberId]);
			return map;
		},
		new Map(),
	);

	const assignedCount = rota.details.length;
	const totalRequiredSlots = sortedRides.reduce(
		(sum, ride) => sum + ride.totalSlots,
		0,
	);
	const isDraft = rota.status === RotaStatus.DRAFT;
	const isActive = rota.status === RotaStatus.ACTIVE;

	return (
		<main className="px-16 py-12 flex flex-col w-full gap-4">
			<div
				className={`rounded-2xl border px-5 py-4 shadow-lg ${isActive ? "bg-emerald-400/20 border-emerald-300/50" : "bg-muted/20"}`}
			>
				<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
					<div>
						<h1 className="text-3xl font-semibold">Rota View</h1>
						<p className="text-sm text-muted-foreground">
							{rota.applicableDate.toLocaleDateString()} - {assignedCount} of{" "}
							{totalRequiredSlots} slots assigned
						</p>
					</div>
					<div className="text-sm font-semibold">Status: {rota.status}</div>
				</div>
			</div>

			<div className="overflow-hidden rounded-2xl border shadow-lg">
				<Table className="text-sm">
					<TableHeader>
						<TableRow>
							<TableHead className="min-w-30">Ride</TableHead>
							{sortedPositions.map((position) => (
								<TableHead key={position.id} className="min-w-48">
									{position.name}
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{sortedRides.map((ride) => (
							<TableRow key={ride.id}>
								<TableCell className="bg-muted/20 text-left">
									<div className="flex flex-col gap-1 px-2">
										<span className="font-semibold">
											{ride.name}{" "}
											<span className="text-zinc-400">({ride.tierName})</span>
										</span>
										<span className="text-xs text-muted-foreground">
											{ride.totalSlots} required slot
											{ride.totalSlots === 1 ? "" : "s"}
										</span>
									</div>
								</TableCell>
								{sortedPositions.map((position) => {
									const quantity = ride.positionQuantities[position.id] ?? 0;
									if (!quantity) {
										return (
											<TableCell
												key={`${ride.id}-${position.id}`}
												className="bg-zinc-950/20 text-zinc-400"
											>
                                              N/A
											</TableCell>
										);
									}

									const cellId = getRidePositionKey(ride.id, position.id);
									const assignedStaff = assignmentsByRidePosition.get(cellId) ?? [];

									return (
										<TableCell
											key={cellId}
											className="align-top py-2 px-4 text-left"
										>
											<div className="mb-1 text-[11px] font-medium text-muted-foreground">
												{assignedStaff.length} / {quantity} assigned
											</div>
											<div className="flex flex-col gap-1 text-xs">
												{assignedStaff.length ? (
													assignedStaff.map((staffId) => (
														<span
															key={staffId}
															className="rounded bg-muted px-2 py-1"
														>
															{staffNameById.get(staffId) ?? "Unknown Name"}
														</span>
													))
												) : (
													<span className="text-zinc-400">No staff assigned</span>
												)}
											</div>
										</TableCell>
									);
								})}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			<div className="flex justify-end gap-2">
				{isDraft && (
					<>
						<Link href={`/rotas/modify/${rota.id}`}>
							<Button variant="secondary">Edit Rota</Button>
						</Link>
						<ActivateRotaButton rotaId={rota.id} disabled={!assignedCount} />
					</>
				)}
			</div>
		</main>
	);
}
