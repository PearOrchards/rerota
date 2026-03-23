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
import { Button } from "@/components/ui/button";
import type { ModifyResponse } from "@/lib/types/common";

interface ConfirmEntityModalProps {
	title: string;
	description?: string;
	trigger: React.ReactNode;
	onConfirm: () => Promise<ModifyResponse>;
	onSuccess?: (response: ModifyResponse) => void | Promise<void>;
	buttonText?: string;
}

/**
 * Generic confirmation modal for doing something (usually deleting an entity)
 * @param title - Modal title (e.g., "Delete Ride")
 * @param description - Modal description (e.g., "Are you sure you want to delete this ride? This action cannot be undone.")
 * @param trigger - ReactNode which triggers modal open (button, menu item, etc)
 * @param onConfirm - Function called when user confirms deletion
 * @param buttonText - Text to show on confirm button (default: "Delete")
 * @constructor
 */
export function ConfirmEntityModal({
	title,
	description,
	trigger,
	onConfirm,
	onSuccess,
	buttonText = "Delete",
}: ConfirmEntityModalProps) {
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();

	const handleConfirm = async (e: React.FormEvent) => {
		e.preventDefault();

		startTransition(async () => {
			try {
				const response = await onConfirm();
				if (response.success) {
					setOpen(false);
					toast.success(response.message || "Action completed successfully.");
					await onSuccess?.(response);
				} else {
					toast.error(response.message || "Failed to perform action.");
				}
			} catch (error) {
				console.error("Error confirming this action:", error);
				toast.error(error instanceof Error ? error.message : "Failed to perform action.");
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
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
							disabled={isPending}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							variant="destructive"
							disabled={isPending}
						>
							{isPending ? "Working..." : buttonText}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
