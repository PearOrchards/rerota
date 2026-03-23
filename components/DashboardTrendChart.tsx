"use client";

import {
	CartesianGrid,
	Line,
	LineChart,
	XAxis,
} from "recharts";
import {
	ChartContainer,
	type ChartConfig,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";

type DashboardTrendChartProps = {
	color: string;
	data: Array<{
		label: string;
		value: number;
	}>;
	maximumFractionDigits?: number;
	valueLabel: string;
	valueSuffix?: string;
};

export default function DashboardTrendChart({
	color,
	data,
	maximumFractionDigits = 0,
	valueLabel,
	valueSuffix = "",
}: DashboardTrendChartProps) {
	const chartConfig = {
		value: {
			label: valueLabel,
			color,
		},
	} satisfies ChartConfig;

	return (
		<ChartContainer config={chartConfig} className="min-h-24 w-full">
			<LineChart accessibilityLayer data={data} margin={{ left: 12, right: 12, top: 8 }}>
				<CartesianGrid vertical={false} />
				<XAxis
					dataKey="label"
					tickLine={false}
					axisLine={false}
					tickMargin={8}
				/>
				<ChartTooltip
					cursor={true}
					content={(
						<ChartTooltipContent
							indicator="line"
							formatter={(value) => {
								const formattedValue = new Intl.NumberFormat("en-GB", {
									maximumFractionDigits,
								}).format(typeof value === "number" ? value : Number(value));

								return [`${formattedValue}${valueSuffix} ${valueLabel}`];
							}}
						/>
					)}
				/>
				<Line
					type="monotone"
					dataKey="value"
					stroke="var(--color-value)"
					strokeWidth={2.5}
					dot={{
						fill: "var(--color-value)",
						strokeWidth: 4,
					}}
					activeDot={{
						r: 8,
					}}
				/>
			</LineChart>
		</ChartContainer>
	);
}
