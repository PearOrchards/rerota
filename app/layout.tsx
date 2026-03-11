import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Toaster } from "@/components/ui/sonner";
import { Figtree } from "next/font/google";
import { ThemeProvider as NextThemeProvider } from "next-themes";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth/session";
import "./globals.css";

const figtreeFont = Figtree({
	variable: "--font-figtree",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Rerota",
	description: "The sophisticated worker deployment platform",
};

function ThemeProvider({
	children,
	...props
}: React.ComponentProps<typeof NextThemeProvider>) {
	return (
		<NextThemeProvider {...props} attribute="class" defaultTheme="system">
			{children}
		</NextThemeProvider>
	);
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const session = await getSession();

	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${figtreeFont.className} antialiased bg-blue-50 dark:bg-zinc-900`}
			>
				<ThemeProvider>
					<SidebarProvider>
						<AppSidebar roleName={session?.roleName ?? null} />
						{children}
						<Toaster position="top-right" />
					</SidebarProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
