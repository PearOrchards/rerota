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
	Settings,
	CircleUser,
	ChevronRight,
	UserPlus,
	LogOut,
	Hash,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const managerItems = [
	{
		title: "Dashboard",
		url: "/",
		icon: Home,
	},
	{
		title: "Business",
		url: "/business",
		icon: LucideBriefcaseBusiness,
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
	{
		title: "Numbers",
		url: "/numbers",
		icon: Hash,
	},
];

const leaderItems = [];
const staffItems = [];

const commonItems = [
	{
		title: "Settings",
		url: "/settings",
		icon: Settings,
	},
];


export function AppSidebar() {
	const path = usePathname();

	return (
		<Sidebar>
			<SidebarHeader className="bg-zinc-800/50 shadow-md m-2 rounded-xl pl-4 font-bold tracking-wide">
				REROTA
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{managerItems.map(({ title, url, icon: Icon }) => (
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
				<SidebarGroup className="mt-auto">
					<SidebarGroupContent>
						<SidebarMenu>
							{commonItems.map(({ title, url, icon: Icon }) => (
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
								<DropdownMenuItem>
									<LogOut /> Sign Out
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