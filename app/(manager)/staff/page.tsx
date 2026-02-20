import { requireSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Table } from "./components/Table";
import { StaffFormModal } from "./components/StaffFormModal";
import { getStaff } from "@/lib/actions/staff";

export default async function StaffPage() {
	const session = await requireSession();
	const staff = await getStaff();

	return (
		<main className="px-16 py-12 flex flex-col w-full">
			<div className="flex flex-row justify-between">
				<div>
					<h1 className="font-semibold text-3xl">STAFF</h1>
					<p className="font-normal italic">The long list of all the staff.</p>
				</div>
				<div className="mt-auto">
					<StaffFormModal
						trigger={
							<Button>
								<Plus /> New Staff Member
							</Button>
						}
						businessId={session.businessId}
					/>
				</div>
			</div>

			<div className="flex py-4">
				<Table data={staff} businessId={session.businessId} />
			</div>
		</main>
	);
}
