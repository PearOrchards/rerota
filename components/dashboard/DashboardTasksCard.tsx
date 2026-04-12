"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { DashboardTask } from "@/lib/types/dashboard";

const LOCAL_STORAGE_PREFIX = "rerota:dismissed-dashboard-tasks";

type DashboardTasksCardProps = {
  tasks: DashboardTask[];
  dismissalScope: string;
};

const getStorageKey = (scope: string): string => `${LOCAL_STORAGE_PREFIX}:${scope}`;

function parseDismissedTaskIds(rawValue: string | null): string[] {
	if (!rawValue) return [];

	try {
		const parsedValue = JSON.parse(rawValue);
		if (!Array.isArray(parsedValue)) return [];

		return parsedValue.filter(
			(value): value is string => typeof value === "string",
		);
	} catch {
		return [];
	}
}

export default function DashboardTasksCard({
	tasks,
	dismissalScope,
}: DashboardTasksCardProps) {
	const [dismissedTaskIds, setDismissedTaskIds] = useState<string[]>(() => {
		if (typeof window === "undefined") return [];
		const storageKey = getStorageKey(dismissalScope);
		return parseDismissedTaskIds(localStorage.getItem(storageKey));
	});

	const visibleTasks = useMemo(() => {
		const dismissedTaskIdSet = new Set(dismissedTaskIds);
		return tasks.filter((task) => !dismissedTaskIdSet.has(task.id));
	}, [dismissedTaskIds, tasks]);

	const handleDismissTask = (taskId: string) => {
		setDismissedTaskIds((currentDismissedTaskIds) => {
			if (currentDismissedTaskIds.includes(taskId)) {
				return currentDismissedTaskIds;
			}

			const nextDismissedTaskIds = [...currentDismissedTaskIds, taskId];
			localStorage.setItem(
				getStorageKey(dismissalScope),
				JSON.stringify(nextDismissedTaskIds),
			);
			return nextDismissedTaskIds;
		});
	};

	const handleResetDismissedTasks = () => {
		setDismissedTaskIds([]);
		localStorage.removeItem(getStorageKey(dismissalScope));
	};

	return (
		<Card className="self-start">
			<CardHeader>
				<CardTitle className="text-lg">Your Tasks</CardTitle>
				<CardDescription>
                    Here&#39;s what needs your attention the most:
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{visibleTasks.length > 0 ? (
					visibleTasks.map((task, index) => (
						<div key={task.id} className="space-y-4">
							<div className="flex flex-row items-end justify-between gap-3">
								<div className="flex flex-row items-center gap-2">
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => handleDismissTask(task.id)}
										aria-label={`Dismiss task: ${task.title}`}
									>
										<X />
									</Button>

									<div className="space-y-1">
										<p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
											Task {index + 1}
										</p>
										<h3 className="font-semibold">{task.title}</h3>
										<p className="text-sm text-muted-foreground">
											{task.description}
										</p>
									</div></div>

								<div className="flex shrink-0 items-center gap-2">
									<Button asChild variant="secondary" size="sm">
										<Link href={task.href}>Go <ChevronRight /></Link>
									</Button>
								</div>
							</div>
							{index < visibleTasks.length - 1 && <Separator />}
						</div>
					))
				) : (
					<div className="space-y-2">
						<p className="text-sm text-muted-foreground">
                            No active tasks right now. You can restore dismissed tasks anytime.
						</p>
						<Button
							type="button"
							variant="secondary"
							size="sm"
							onClick={handleResetDismissedTasks}
						>
                            Show dismissed tasks
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
