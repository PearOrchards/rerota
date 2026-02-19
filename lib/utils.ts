import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Returns a human-readable error message for displaying to a front-end user.
 * @param error - The error object to extract the message from.
 * @returns A string containing the error message.
 */
export function extractReadableErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	} else if (typeof error === "string") {
		return error;
	} else {
		return "An unknown error occurred.";
	}
}