interface BusinessLayoutProps {
    children: React.ReactNode;
    tiers: React.ReactNode;
}

export default function BusinessLayout({
	children,
	tiers,
}: BusinessLayoutProps) {
	return (
		<main className="px-16 py-12 flex flex-col w-full">
			{ children }

			<div className="grid grid-cols-2 grid-rows-2 gap-4 py-4">
				<div className="rounded-xl border p-4">
					{ tiers }
				</div>
			</div>
		</main>
	);
}