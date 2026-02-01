"use client";

import React, { ReactNode, useState, useTransition } from "react";
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

export interface EntityFormModalProps<T> {
	entity?: T;
	trigger: ReactNode;
	title: string;
	description?: string;
	children: (entity: T | undefined, onChange: (field: keyof T, value: unknown) => void) => ReactNode;
	onSubmit: (entity: T) => Promise<boolean>;
	getDefaultValues: () => T;
	onSuccess?: () => void;
}

/**
 * Generic modal form for creating/editing entities.
 * @param entity - Entity being updated, or leave undefined for new entity
 * @param trigger - ReactNode which triggers modal open (button, menu item, etc)
 * @param title - Modal title
 * @param description - Modal description (optional)
 * @param children - Function which renders form fields
 * @param onSubmit - Function called on form submission
 * @param getDefaultValues - Function to get default values for new entity
 * @param onSuccess - Optional callback after successful submission
 * @constructor
 */
export function EntityFormModal<T extends Record<string, unknown>>({
	entity,
	trigger,
	title,
	description,
	children,
	onSubmit,
	getDefaultValues,
	onSuccess,
}: EntityFormModalProps<T>) {
	const [open, setOpen] = useState(false);
	const [formData, setFormData] = useState<T>(entity || getDefaultValues());
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	const isEditMode = !!entity;

	// Reset form data when dialog opens/closes or entity changes
	React.useEffect(() => {
		if (open) {
			setFormData(entity || getDefaultValues());
			setError(null);
		}
	}, [open, entity, getDefaultValues]);

	const handleChange = (field: keyof T, value: unknown) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async (e: React.SubmitEvent) => {
		e.preventDefault();
		setError(null);

		startTransition(async () => {
			try {
				const success = await onSubmit(formData);
				if (success) {
					setOpen(false);
					onSuccess?.();
				} else {
					setError("Failed to save. Please try again.");
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : "An error occurred");
			}
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger}
			</DialogTrigger>
			<DialogContent>
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
						{description && <DialogDescription>{description}</DialogDescription>}
					</DialogHeader>
					<div className="grid gap-4 py-4">
						{children(formData, handleChange)}
					</div>
					{error && (
						<div className="text-sm text-red-600 dark:text-red-400 mb-2">
							{error}
						</div>
					)}
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
							disabled={isPending}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending ? "Saving..." : isEditMode ? "Save Changes" : "Create"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
