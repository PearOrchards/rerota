"use client";

export function TestButton({ testFunction }: { testFunction?: () => void }) {
	return (
		<button onClick={testFunction}>
            Discrete Prisma Test...
		</button>
	);
}