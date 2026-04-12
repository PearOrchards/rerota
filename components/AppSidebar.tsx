"use client";

import {
	Sidebar,
	SidebarContent, SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "./ui/sidebar";
import {
	Home,
	LucideBriefcaseBusiness,
	Users,
	RollerCoaster,
	GraduationCap,
	Settings,
	CircleUser,
	ChevronRight,
	UserPlus,
	LogOut,
	Hash,
	ArrowLeftRight, Grid2X2,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import {
	canSwitchSidebarView,
	resolveSidebarMode,
	SIDEBAR_VIEW_MODE_COOKIE_MAX_AGE,
	SIDEBAR_VIEW_MODE_COOKIE_NAME,
	type SidebarMode,
	type SidebarViewMode,
} from "@/lib/sidebarViewMode";

const managerItems = [
	{
		header: "Home",
		sections: [
			{
				title: "Dashboard",
				url: "/",
				icon: Home,
			},
		],
	},
	{
		header: "Manage",
		sections: [
			{
				title: "Competencies",
				url: "/competencies",
				icon: GraduationCap,
			},
			{
				title: "Staff",
				url: "/staff",
				icon: Users,
			},
			{
				title: "Rides",
				url: "/rides",
				icon: RollerCoaster,
			},
		],
	},
	{
		header: "Logic",
		sections: [
			{
				title: "Business",
				url: "/business",
				icon: LucideBriefcaseBusiness,
			},
			{
				title: "Numbers",
				url: "/numbers",
				icon: Hash,
			},
		],
	},
];

const leaderItems = [
	{
		header: "Home",
		sections: [
			{
				title: "Dashboard",
				url: "/",
				icon: Home,
			},
			{
				title: "Rotas",
				url: "/rotas",
				icon: Grid2X2,
			},
		],
	},
	{
		header: "Team",
		sections: [
			{
				title: "Competencies",
				url: "/competencies",
				icon: GraduationCap,
			},
		],
	},
];
const staffItems = [
	{
		header: "Home",
		sections: [
			{
				title: "Dashboard",
				url: "/",
				icon: Home,
			},
		],
	},
];

const commonItems = {
	header: "App",
	sections: [
		{
			title: "Settings",
			url: "/settings",
			icon: Settings,
		},
	],
};

const viewModeLabels: Record<SidebarMode, string> = {
	manager: "Manager",
	leader: "Team Leader",
	staff: "Staff",
};

const sidebarItemsByMode: Record<SidebarMode, typeof managerItems> = {
	manager: managerItems,
	leader: leaderItems,
	staff: staffItems,
};

type AppSidebarProps = {
	initialViewMode?: SidebarViewMode | null;
	roleName: string | null;
};

export function AppSidebar({
	initialViewMode,
	roleName,
}: AppSidebarProps) {
	const path = usePathname();
	const router = useRouter();
	const canSwitchView = canSwitchSidebarView(roleName);
	const [switchableViewMode, setSwitchableViewMode] = useState<SidebarViewMode>(
		initialViewMode ?? "manager",
	);
	const viewMode = resolveSidebarMode(roleName, switchableViewMode);
	const sidebarItems = sidebarItemsByMode[viewMode];

	const toggleView = () => {
		if (!canSwitchView) {
			return;
		}

		const nextMode = switchableViewMode === "manager" ? "leader" : "manager";
		setSwitchableViewMode(nextMode);
		document.cookie = `${SIDEBAR_VIEW_MODE_COOKIE_NAME}=${nextMode}; path=/; max-age=${SIDEBAR_VIEW_MODE_COOKIE_MAX_AGE}`;

		if (path === "/") {
			router.refresh();
		}
	};

	const logout = async () => {
		await fetch("/api/auth/logout", { method: "POST" });
		window.location.href = "/login";
	};

	if (path === "/login" || path === "/unauthorized") return null;

	return (
		<Sidebar>
			<SidebarHeader className="bg-zinc-200/50 dark:bg-zinc-800/50 shadow-md m-2 rounded-xl px-4 font-bold tracking-wide">
				<div className="flex items-center justify-between">
					<span>REROTA</span>
					{viewMode ? (
						<span className="text-xs font-semibold text-sidebar-foreground/70">
							{viewModeLabels[viewMode]}
						</span>
					) : null}
				</div>
			</SidebarHeader>
			<SidebarContent>
				{ sidebarItems.map(({ header, sections }) => (
					<SidebarGroup key={header}>
						<SidebarGroupLabel>{header}</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{sections.map(({ title, url, icon: Icon }) => (
									<SidebarMenuItem key={title}>
										<SidebarMenuButton className={path === url ? "bg-sidebar-accent/50" : ""} asChild>
											<Link href={url}>
												<Icon />
												<span>{title}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				)) }
				<SidebarGroup className="mt-auto">
					<SidebarGroupLabel>{commonItems.header}</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{commonItems.sections.map(({ title, url, icon: Icon }) => (
								<SidebarMenuItem key={title}>
									<SidebarMenuButton className={path === url ? "bg-sidebar-accent/50" : ""} asChild>
										<Link href={url}>
											<Icon />
											<span>{title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<SidebarMenuButton>
									<CircleUser />
									<span>John Doe</span>
									<ChevronRight className="ml-auto" />
								</SidebarMenuButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent side="right">
								{canSwitchView ? (
									<DropdownMenuItem onSelect={toggleView}>
										<ArrowLeftRight />
										{viewMode === "leader" ? "Switch to Manager view" : "Switch to Team Leader view"}
									</DropdownMenuItem>
								) : null}
								<DropdownMenuItem onSelect={() => void logout()}>
									<LogOut /> Log Out
								</DropdownMenuItem>
								<DropdownMenuItem>
									<UserPlus /> Add Account
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
