import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import DashboardTrendChart from "@/components/DashboardTrendChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
	getDashboardMetricsForBusiness,
	type DashboardMetrics,
} from "@/lib/server/metrics";
import {
	resolveManagerSidebarViewMode,
	SIDEBAR_VIEW_MODE_COOKIE_NAME,
} from "@/lib/sidebarViewMode";
import { ChevronRight } from "lucide-react";

const importantTasks = [
	{
		title: "Review expiring competencies",
		description: "Placeholder task (potential example)",
		href: "/competencies",
	},
	{
		title: "Check staff in training",
		description: "Placeholder task (potential example)",
		href: "/staff",
	},
	{
		title: "Audit rides with thin cover",
		description: "Placeholder task (potential example)",
		href: "/rides",
	},
	{
		title: "Update business thresholds",
		description: "Placeholder task (potential example)",
		href: "/numbers",
	},
] as const;

const uptimeChartData = [
	{ label: "W1", value: 92 },
	{ label: "W2", value: 93 },
	{ label: "W3", value: 95 },
	{ label: "W4", value: 94 },
	{ label: "W5", value: 96 },
	{ label: "W6", value: 95 },
] as const;

const happinessChartData = [
	{ label: "W1", value: 3.6 },
	{ label: "W2", value: 3.8 },
	{ label: "W3", value: 4.1 },
	{ label: "W4", value: 3.9 },
	{ label: "W5", value: 4.2 },
	{ label: "W6", value: 4.0 },
] as const;

function PlaceholderBadge() {
	return (
		<Badge variant="outline" className="uppercase tracking-widest">
			Placeholder
		</Badge>
	);
}

type DashboardMetricCardProps = {
	description: string;
	label: string;
	value: number;
	placeholder?: boolean;
};

function DashboardMetricCard({
	description,
	label,
	value,
	placeholder,
}: DashboardMetricCardProps) {
	return (
		<Card className="gap-1">
			<CardHeader>
				<CardDescription className="font-medium">{label}</CardDescription>

				{ placeholder && <CardAction><PlaceholderBadge /></CardAction> }
			</CardHeader>
			<CardContent>
				<p className="font-bold text-4xl tracking-tight">
					{value.toLocaleString("en-GB")}
				</p>
				<p className="mt-2 text-sm text-muted-foreground">
					{description}
				</p>
			</CardContent>
		</Card>
	);
}

function PlaceholderChart({
	color,
	data,
	title,
	description,
	summary,
	valueLabel,
	valueSuffix,
	maxFractionDigits,
}: {
	color: string;
	data: Array<{
		label: string;
		value: number;
	}>;
	description: string;
	maxFractionDigits?: number;
	summary: string;
	title: string;
	valueLabel: string;
	valueSuffix?: string;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">{title}</CardTitle>
				<CardDescription>{description}</CardDescription>

				<CardAction>
					<PlaceholderBadge />
				</CardAction>
			</CardHeader>
			<CardContent>
				<div className="rounded-2xl border bg-muted p-4">
					<DashboardTrendChart
						color={color}
						data={data}
						maximumFractionDigits={maxFractionDigits}
						valueLabel={valueLabel}
						valueSuffix={valueSuffix}
					/>
				</div>
				<p className="mt-4 text-sm">{summary}</p>
			</CardContent>
		</Card>
	);
}

function ManagerDashboard({
	metrics,
	name,
}: {
	metrics: DashboardMetrics;
	name: string | undefined;
}) {
	const metricCards: DashboardMetricCardProps[] = [
		{
			label: "Expiring Competencies",
			value: metrics.expiringCompetencies,
			description: "Competencies due to expire within the next 14 days.",
		},
		{
			label: "Staff in Training",
			value: 8,
			description: "Staff currently with training hours.",
			placeholder: true,
		},
		{
			label: "Under-covered Positions",
			value: metrics.underCoveredRidePositions,
			description:
				"Ride-position pairs with fewer than 3x the required competent staff.",
		},
	];

	return (
		<main className="flex min-h-full flex-1 flex-col gap-4 px-4 py-8 lg:px-8">
			<section className="flex flex-col gap-4 rounded-4xl border border-emerald-800 bg-linear-to-br from-green-900 via-emerald-900 to-emerald-950 px-6 py-8 text-white shadow-xl shadow-emerald-950/20">
				<div className="max-w-2xl">
					<p className="text-sm font-semibold uppercase tracking-widest text-white/80">
						Rerota - Manager
					</p>
					<h1 className="mt-2 text-4xl font-semibold tracking-tight">
						Hello{ name ? `, ${name}` : "" }
					</h1>
				</div>
			</section>

			<section className="grid gap-4 lg:grid-cols-3">
				{metricCards.map((metric) => (
					<DashboardMetricCard key={metric.label} {...metric} />
				))}
			</section>

			<section className="grid items-start gap-4 xl:grid-cols-[1.1fr_0.9fr]">
				<Card className="self-start">
					<CardHeader>
						<CardTitle className="text-lg">Your Tasks</CardTitle>
						<CardDescription>
							Here&#39;s what needs your attention the most:
						</CardDescription>

						<CardAction>
							<PlaceholderBadge />
						</CardAction>
					</CardHeader>
					<CardContent className="space-y-4">
						{importantTasks.map((task, index) => (
							<div key={task.title} className="space-y-4">
								<div className="flex flex-row items-end justify-between">
									<div className="space-y-1">
										<p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
											Task {index + 1}
										</p>
										<h3 className="font-semibold">{task.title}</h3>
										<p className="text-sm text-muted-foreground">
											{task.description}
										</p>
									</div>
									<Button asChild variant="secondary" size="sm">
										<Link href={task.href}>Go <ChevronRight /></Link>
									</Button>
								</div>
								{ index < importantTasks.length - 1 && <Separator /> }
							</div>
						))}
					</CardContent>
				</Card>

				<div className="grid gap-4">
					<PlaceholderChart
						title="Average uptime"
						description="Weekly placeholder trend until live ride availability data is connected."
						data={uptimeChartData.map((point) => ({ ...point }))}
						color="var(--chart-1)"
						valueLabel="Uptime"
						valueSuffix="%"
						summary="Current placeholder trend: 95% average uptime over the last six weeks."
					/>
					<PlaceholderChart
						title="Average ride operator happiness"
						description="Weekly placeholder trend until operator sentiment tracking is available."
						data={happinessChartData.map((point) => ({ ...point }))}
						color="var(--chart-2)"
						valueLabel="Happiness"
						valueSuffix=" / 5"
						maxFractionDigits={1}
						summary="Current placeholder trend: 4.0 / 5 average operator happiness."
					/>
				</div>
			</section>
		</main>
	);
}

function TeamLeaderDashboardPlaceholder() {
	return (
		<main className="flex min-h-full flex-1 flex-col gap-4 px-4 py-8 lg:px-8">
			<Card className="mx-auto flex w-full max-w-3xl flex-1 justify-center rounded-4xl">
				<CardHeader className="space-y-4 text-center">
					<div className="flex justify-center">
						<Badge variant="outline" className="uppercase tracking-widest">Team Leader Dashboard</Badge>
					</div>
					<CardTitle className="text-4xl">Nothing here yet</CardTitle>
					<CardDescription>Still to be implemented...</CardDescription>
				</CardHeader>
			</Card>
		</main>
	);
}

export default async function DashboardPage() {
	const [session, cookieStore] = await Promise.all([getSession(), cookies()]);

	if (!session) {
		redirect("/login");
	}

	if (session.roleName === "Team Leader") {
		return <TeamLeaderDashboardPlaceholder />;
	}

	if (session.roleName !== "Staff") {
		const dashboardViewMode = resolveManagerSidebarViewMode(
			cookieStore.get(SIDEBAR_VIEW_MODE_COOKIE_NAME)?.value,
		);

		if (dashboardViewMode === "leader") {
			return <TeamLeaderDashboardPlaceholder />;
		}

		const [user, metrics] = await Promise.all([
			prisma.staffMember.findUnique({
				where: { id: session.sub },
				select: { firstName: true },
			}),
			getDashboardMetricsForBusiness(session.businessId),
		]);

		return <ManagerDashboard metrics={metrics} name={user?.firstName} />;
	}

	return null;
}
