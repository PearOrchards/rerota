export type NumberMatrixCategory = {
	id: string;
	name: string;
};

export type NumberMatrixRow = {
	tierId: string;
	positionId: string;
	rideTier: number;
	positionTier: string;
	values: Record<string, number>;
};

export type NumberMatrixTableData = {
	categories: NumberMatrixCategory[];
	rows: NumberMatrixRow[];
};
