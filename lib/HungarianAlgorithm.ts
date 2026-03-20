type StaffScores = Map<string, Map<string, number>>; // { staff <- { ride:position <- score }[] }[]

export class HungarianAlgorithm {
	// Separated out so Hungarian can run more easily
	private readonly staff: string[] = [];
	private readonly ridePosition: string[] = [];
	private scores: number[][] = [[]];

	private readonly rowCount: number;
	private readonly colCount: number;
	private readonly assignmentSize: number;

	private coveredRows: boolean[] = [];
	private coveredCols: boolean[] = [];
	private starred: boolean[][] = [];
	private primed: boolean[][] = [];

	constructor(input: StaffScores) {
		// Handles all the initialisation of fields
		this.staff = Array.from(input.keys());

		const uniquePositions: Set<string> = new Set();
		input.values().forEach((scoreList: Map<string, number>) =>
			scoreList.keys().forEach((key: string) => uniquePositions.add(key)),
		);
		this.ridePosition = Array.from(uniquePositions);

		for (let s = 0; s < this.staff.length; s++) {
			const staff = this.staff[s];
			const staffScores = input.get(staff)!;

			this.scores[s] ??= []; // if empty, create a new array

			for (let r = 0; r < this.ridePosition.length; r++) {
				const ridePos = this.ridePosition[r];
				this.scores[s][r] = staffScores.get(ridePos) ?? 0;
			}
		}

		if (this.staff.length == 0) throw new Error("No Staff found.");
		if (this.ridePosition.length == 0) throw new Error("No Ride Positions found.");
		if (this.scores.length == 0) throw new Error("No scores initialised for any staff");
		const firstRowLength = this.scores[0].length;
		this.scores.forEach((person: number[]) => {
			if (person.length != firstRowLength) throw new Error("Inconsistent scores matrix");
		});

		this.coveredRows = new Array(this.staff.length).fill(false);
		this.coveredCols = new Array(this.ridePosition.length).fill(false);
		this.starred = Array.from({ length: this.staff.length }, () =>
			new Array(this.ridePosition.length).fill(false),
		);
		this.primed = Array.from({ length: this.staff.length }, () =>
			new Array(this.ridePosition.length).fill(false),
		);

		this.rowCount = this.staff.length;
		this.colCount = this.ridePosition.length;
		this.assignmentSize = Math.min(this.rowCount, this.colCount);

		// As we are providing scores (where higher is better), they must be inverted for the algo to work correctly (as it assumes a cost matrix where lower is better).
		this.invert();
	}

	/**
	 * Runs the solver for the algorithm
	 * @return the optimal mapping of staff => ridePosition
	 */
	public solve(): Map<string, string> {
		this.reduce();
		this.starInitialZeros();
		this.coverColumnsWithStars();

		while (!this.hasEnoughCoveredColumns()) {
			const uncoveredZero = this.findUncoveredZero();

			if (!uncoveredZero) {
				this.adjustBySmallestUncovered();
				continue;
			}

			const [row, col] = uncoveredZero;
			this.primed[row][col] = true;

			const starredColInRow = this.findStarInRow(row);
			if (starredColInRow !== -1) {
				this.coveredRows[row] = true;
				this.coveredCols[starredColInRow] = false;
				continue;
			}

			this.augmentFrom(row, col);
			this.clearPrimes();
			this.coveredRows.fill(false);
			this.coverColumnsWithStars();
		}

		const mapping: Map<string, string> = new Map();
		for (let r = 0; r < this.rowCount; r++) {
			for (let c = 0; c < this.colCount; c++) {
				if (this.starred[r][c]) {
					mapping.set(this.staff[r], this.ridePosition[c]);
					break;
				}
			}
		}

		return mapping;
	}

	/**
	 * Prints the current state of the scores array to the console
	 * @private
	 */
	private log(): void {
		console.log(this.scores.map((s) => s.join("\t")).join("\n"));
	}

	private invert(): void {
		const maxScore = Math.max(...this.scores.flat());
		this.scores = this.scores.map(s => s.map(r => maxScore - r));
	}

	/**
	 * Performs row reduction, then column reduction (subtracting all numbers in a row/column so at least becomes zero)
	 * @private
	 */
	private reduce(): void {
		// row reduction (staff)
		this.scores = this.scores.map(s => {
			const min = Math.min(...s);
			return s.map(r => r - min);
		});

		// column reduction (ridePosition)
		for (let c = 0; c < this.scores[0].length; c++) {
			const col = this.scores.map(s => s[c]);
			const min = Math.min(...col);
			for (let r = 0; r < this.scores.length; r++) {
				this.scores[r][c] -= min;
			}
		}
	}

	/**
	 * Keeps track of where original zeros lie, before adjustments are made
	 * @private
	 */
	private starInitialZeros(): void {
		const rowHasStar = new Array(this.rowCount).fill(false);
		const colHasStar = new Array(this.colCount).fill(false);

		for (let r = 0; r < this.rowCount; r++) {
			for (let c = 0; c < this.colCount; c++) {
				if (this.scores[r][c] === 0 && !rowHasStar[r] && !colHasStar[c]) {
					this.starred[r][c] = true;
					rowHasStar[r] = true;
					colHasStar[c] = true;
				}
			}
		}
	}

	/**
	 * Marks where columns should be covered based on the starred zeros
	 * @private
	 */
	private coverColumnsWithStars(): void {
		this.coveredCols.fill(false);
		for (let c = 0; c < this.colCount; c++) {
			for (let r = 0; r < this.rowCount; r++) {
				if (this.starred[r][c]) {
					this.coveredCols[c] = true;
					break;
				}
			}
		}
	}

	/**
	 * Check if the current state is a valid solution (i.e. enough columns are covered to have a complete assignment)
	 * @private
	 */
	private hasEnoughCoveredColumns(): boolean {
		let coveredCount = 0;
		for (let c = 0; c < this.colCount; c++) {
			if (this.coveredCols[c]) coveredCount++;
		}
		return coveredCount >= this.assignmentSize;
	}

	private findUncoveredZero(): [number, number] | null {
		for (let r = 0; r < this.rowCount; r++) {
			if (this.coveredRows[r]) continue;
			for (let c = 0; c < this.colCount; c++) {
				if (!this.coveredCols[c] && this.scores[r][c] === 0) return [r, c];
			}
		}
		return null;
	}

	private findStarInRow(row: number): number {
		for (let c = 0; c < this.colCount; c++) {
			if (this.starred[row][c]) return c;
		}
		return -1;
	}

	private findStarInCol(col: number): number {
		for (let r = 0; r < this.rowCount; r++) {
			if (this.starred[r][col]) return r;
		}
		return -1;
	}

	private findPrimeInRow(row: number): number {
		for (let c = 0; c < this.colCount; c++) {
			if (this.primed[row][c]) return c;
		}
		return -1;
	}

	/**
	 * Augments the path of starred and primed zeros, starting from the given uncovered zero, until it can no longer be extended. Then flips the starred/primed status along the path.
	 * This is what helps the algorithm to find a new optimal solution after an uncovered zero is found.
	 * @param startRow
	 * @param startCol
	 * @private
	 */
	private augmentFrom(startRow: number, startCol: number): void {
		const path: Array<[number, number]> = [[startRow, startCol]];

		while (true) {
			const [, currentCol] = path[path.length - 1];
			const rowWithStar = this.findStarInCol(currentCol);
			if (rowWithStar === -1) break;

			path.push([rowWithStar, currentCol]);
			const colWithPrime = this.findPrimeInRow(rowWithStar);
			if (colWithPrime === -1) {
				throw new Error("Invalid Hungarian state: expected primed zero in starred row.");
			}

			path.push([rowWithStar, colWithPrime]);
		}

		for (const [r, c] of path) {
			this.starred[r][c] = !this.starred[r][c];
		}
	}

	private clearPrimes(): void {
		for (let r = 0; r < this.rowCount; r++) {
			this.primed[r].fill(false);
		}
	}

	/**
	 * Adjusts the scores matrix by subtracting the smallest uncovered value from all uncovered elements, and adding it to all elements that are covered twice (i.e. both their row and column are covered),
	 * which makes new zeros in the matrix, allowing the algorithm to continue finding optimal assignments.
	 * @private
	 */
	private adjustBySmallestUncovered(): void {
		let minUncovered = Number.POSITIVE_INFINITY;
		for (let r = 0; r < this.rowCount; r++) {
			if (this.coveredRows[r]) continue;
			for (let c = 0; c < this.colCount; c++) {
				if (!this.coveredCols[c]) {
					minUncovered = Math.min(minUncovered, this.scores[r][c]);
				}
			}
		}

		if (!Number.isFinite(minUncovered)) {
			throw new Error("Unable to adjust matrix: no uncovered values available.");
		}

		for (let r = 0; r < this.rowCount; r++) {
			for (let c = 0; c < this.colCount; c++) {
				if (!this.coveredRows[r] && !this.coveredCols[c]) {
					this.scores[r][c] -= minUncovered;
				} else if (this.coveredRows[r] && this.coveredCols[c]) {
					this.scores[r][c] += minUncovered;
				}
			}
		}
	}
}