"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import type { ModifyResponse } from "@/lib/types/common";

interface DeleteEntityModalProps {
    title: string;
    description?: string;
    trigger: React.ReactNode;
    onConfirm: () => Promise<ModifyResponse>;
}

/**
 * Generic confirmation modal for deleting entities.
 * @param title - Modal title (e.g., "Delete Ride")
 * @param description - Modal description (e.g., "Are you sure you want to delete this ride? This action cannot be undone.")
 * @param trigger - ReactNode which triggers modal open (button, menu item, etc)
 * @param onConfirm - Function called when user confirms deletion
 * @constructor
 */
export function DeleteEntityModal({
	title,
	description,
	trigger,
	onConfirm,
}: DeleteEntityModalProps) {
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();

	const handleConfirm = async (e: React.FormEvent) => {
		e.preventDefault();

		startTransition(async () => {
			try {
				const response = await onConfirm();
				if (response.success) {
					setOpen(false);
					toast.success(response.message || "Deleted successfully.");
				} else {
					toast.error(response.message || "Failed to delete.");
				}
			} catch (error) {
				console.error("Error deleting entity:", error);
				toast.error(error instanceof Error ? error.message : "Failed to delete.");
			}
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger}
			</DialogTrigger>
			<DialogContent>
				<form onSubmit={handleConfirm}>
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
						{description && <DialogDescription>{description}</DialogDescription>}
					</DialogHeader>
					<DialogFooter className="pt-4">
						<button
							type="button"
							className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded mr-2"
							onClick={() => setOpen(false)}
							disabled={isPending}
						>
                            Cancel
						</button>
						<button
							type="submit"
							className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded"
							disabled={isPending}
						>
							{isPending ? "Deleting..." : "Delete"}
						</button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
