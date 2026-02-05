import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
	return (
		<div className="flex items-center justify-center w-full h-full min-h-100">
			<Spinner />
		</div>
	);
}
