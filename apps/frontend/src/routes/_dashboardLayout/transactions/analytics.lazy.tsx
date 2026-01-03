import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
	DatePickerInput,
	type DateRange,
	Select,
	Skeleton,
} from "@repo/ui";
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
	TbArrowLeft,
	TbArrowNarrowDown,
	TbArrowNarrowUp,
	TbCash,
	TbReceipt,
	TbTrendingDown,
	TbTrendingUp,
} from "react-icons/tb";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	XAxis,
	YAxis,
} from "recharts";
import client from "@/honoClient";

export const Route = createLazyFileRoute(
	"/_dashboardLayout/transactions/analytics",
)({
	component: AnalyticsPage,
});

// Chart color palette
const CHART_COLORS = [
	"hsl(var(--chart-1))",
	"hsl(var(--chart-2))",
	"hsl(var(--chart-3))",
	"hsl(var(--chart-4))",
	"hsl(var(--chart-5))",
	"hsl(210, 70%, 50%)",
	"hsl(280, 65%, 60%)",
	"hsl(30, 80%, 55%)",
];

// Helper to format currency
const formatCurrency = (value: number) =>
	new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);

// Helper to format short currency (for chart axis)
const formatShortCurrency = (value: number) => {
	if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}M`;
	if (value >= 1000000) return `${(value / 1000000).toFixed(1)}jt`;
	if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`;
	return value.toString();
};

// Quick date range options
const DATE_RANGE_OPTIONS = [
	{ value: "7d", label: "7 Hari Terakhir" },
	{ value: "30d", label: "30 Hari Terakhir" },
	{ value: "90d", label: "3 Bulan Terakhir" },
	{ value: "365d", label: "1 Tahun Terakhir" },
	{ value: "thisMonth", label: "Bulan Ini" },
	{ value: "lastMonth", label: "Bulan Lalu" },
	{ value: "thisYear", label: "Tahun Ini" },
	{ value: "custom", label: "Kustom" },
];

function getDateRangeFromOption(option: string): DateRange {
	const now = new Date();
	const endDate = new Date(now);
	endDate.setHours(23, 59, 59, 999);

	switch (option) {
		case "7d": {
			const startDate = new Date(now);
			startDate.setDate(startDate.getDate() - 7);
			startDate.setHours(0, 0, 0, 0);
			return { from: startDate, to: endDate };
		}
		case "30d": {
			const startDate = new Date(now);
			startDate.setDate(startDate.getDate() - 30);
			startDate.setHours(0, 0, 0, 0);
			return { from: startDate, to: endDate };
		}
		case "90d": {
			const startDate = new Date(now);
			startDate.setDate(startDate.getDate() - 90);
			startDate.setHours(0, 0, 0, 0);
			return { from: startDate, to: endDate };
		}
		case "365d": {
			const startDate = new Date(now);
			startDate.setDate(startDate.getDate() - 365);
			startDate.setHours(0, 0, 0, 0);
			return { from: startDate, to: endDate };
		}
		case "thisMonth": {
			const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
			startDate.setHours(0, 0, 0, 0);
			return { from: startDate, to: endDate };
		}
		case "lastMonth": {
			const startDate = new Date(
				now.getFullYear(),
				now.getMonth() - 1,
				1,
			);
			startDate.setHours(0, 0, 0, 0);
			const lastDayOfLastMonth = new Date(
				now.getFullYear(),
				now.getMonth(),
				0,
			);
			lastDayOfLastMonth.setHours(23, 59, 59, 999);
			return { from: startDate, to: lastDayOfLastMonth };
		}
		case "thisYear": {
			const startDate = new Date(now.getFullYear(), 0, 1);
			startDate.setHours(0, 0, 0, 0);
			return { from: startDate, to: endDate };
		}
		default: {
			// Return a default date range for custom
			const defaultStart = new Date();
			defaultStart.setDate(defaultStart.getDate() - 30);
			defaultStart.setHours(0, 0, 0, 0);
			const defaultEnd = new Date();
			defaultEnd.setHours(23, 59, 59, 999);
			return { from: defaultStart, to: defaultEnd };
		}
	}
}
export default function AnalyticsPage() {
	const [quickRange, setQuickRange] = useState("30d");
	const [customDateRange, setCustomDateRange] = useState<
		DateRange | undefined
	>(undefined);

	// Determine the effective date range
	const effectiveDateRange = useMemo(() => {
		if (quickRange === "custom" && customDateRange) {
			return customDateRange;
		}
		return getDateRangeFromOption(quickRange);
	}, [quickRange, customDateRange]);

	// Fetch analytics data
	const { data, isLoading, error } = useQuery({
		queryKey: [
			"analytics",
			effectiveDateRange.from?.toISOString(),
			effectiveDateRange.to?.toISOString(),
		],
		queryFn: async () => {
			const res = await client.money.analytics.$get({
				query: {
					startDate: effectiveDateRange.from?.toISOString(),
					endDate: effectiveDateRange.to?.toISOString(),
				},
			});
			if (!res.ok) throw new Error("Failed to fetch analytics");
			return res.json();
		},
		enabled: !!effectiveDateRange.from && !!effectiveDateRange.to,
	});

	// Chart configs
	const trendChartConfig: ChartConfig = {
		income: {
			label: "Pemasukan",
			color: "hsl(142, 76%, 36%)",
		},
		expense: {
			label: "Pengeluaran",
			color: "hsl(0, 84%, 60%)",
		},
	};

	const netChartConfig: ChartConfig = {
		net: {
			label: "Saldo Bersih",
			color: "hsl(217, 91%, 60%)",
		},
	};

	// Generate expense pie chart config dynamically
	const expenseChartConfig: ChartConfig = useMemo(() => {
		if (!data?.expenseBreakdown) return {};
		return data.expenseBreakdown.reduce((acc, item, index) => {
			acc[item.categoryName] = {
				label: item.categoryName,
				color:
					item.categoryColor ||
					CHART_COLORS[index % CHART_COLORS.length],
			};
			return acc;
		}, {} as ChartConfig);
	}, [data?.expenseBreakdown]);

	// Generate income pie chart config dynamically
	const incomeChartConfig: ChartConfig = useMemo(() => {
		if (!data?.incomeBreakdown) return {};
		return data.incomeBreakdown.reduce((acc, item, index) => {
			acc[item.categoryName] = {
				label: item.categoryName,
				color:
					item.categoryColor ||
					CHART_COLORS[index % CHART_COLORS.length],
			};
			return acc;
		}, {} as ChartConfig);
	}, [data?.incomeBreakdown]);

	if (error) {
		return (
			<div className="p-6 h-full flex flex-col">
				<Card className="flex-1 flex items-center justify-center">
					<div className="text-center">
						<p className="text-destructive mb-4">
							Gagal memuat data analisis
						</p>
						<Button
							variant="outline"
							onClick={() => window.location.reload()}
						>
							Coba Lagi
						</Button>
					</div>
				</Card>
			</div>
		);
	}

	return (
		<div className="p-6 h-full flex flex-col gap-6 overflow-auto">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					<Link to="/transactions">
						<Button variant="ghost" size="icon">
							<TbArrowLeft className="h-5 w-5" />
						</Button>
					</Link>
					<div>
						<h1 className="text-2xl font-bold">
							Analisis Keuangan
						</h1>
						<p className="text-muted-foreground">
							Lihat tren dan breakdown transaksi Anda
						</p>
					</div>
				</div>

				{/* Date Range Filter */}
				<div className="flex flex-col sm:flex-row gap-2">
					<Select
						value={quickRange}
						onChange={setQuickRange}
						options={DATE_RANGE_OPTIONS}
						className="w-[180px]"
					/>

					{quickRange === "custom" && (
						<DatePickerInput
							mode="range"
							value={customDateRange}
							onChange={setCustomDateRange}
							placeholder="Pilih rentang tanggal"
							className="w-[280px]"
						/>
					)}
				</div>
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<SummaryCard
					title="Total Pemasukan"
					value={data?.summary.totalIncome ?? 0}
					icon={TbArrowNarrowUp}
					isLoading={isLoading}
					variant="income"
				/>
				<SummaryCard
					title="Total Pengeluaran"
					value={data?.summary.totalExpense ?? 0}
					icon={TbArrowNarrowDown}
					isLoading={isLoading}
					variant="expense"
				/>
				<SummaryCard
					title="Saldo Bersih"
					value={data?.summary.netFlow ?? 0}
					icon={
						(data?.summary.netFlow ?? 0) >= 0
							? TbTrendingUp
							: TbTrendingDown
					}
					isLoading={isLoading}
					variant={
						(data?.summary.netFlow ?? 0) >= 0 ? "income" : "expense"
					}
				/>
				<SummaryCard
					title="Total Transaksi"
					value={data?.summary.transactionCount ?? 0}
					icon={TbReceipt}
					isLoading={isLoading}
					variant="neutral"
					isCurrency={false}
				/>
			</div>

			{/* Daily/Monthly Trend Charts */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Daily Trend Chart */}
				<Card>
					<CardHeader>
						<CardTitle>Tren Harian</CardTitle>
						<CardDescription>
							Pemasukan vs Pengeluaran per hari
						</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<Skeleton className="h-[300px] w-full" />
						) : data?.dailyTrends && data.dailyTrends.length > 0 ? (
							<ChartContainer
								config={trendChartConfig}
								className="h-[300px] w-full"
							>
								<BarChart data={data.dailyTrends}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis
										dataKey="date"
										tickFormatter={(value) => {
											const date = new Date(value);
											return date.toLocaleDateString(
												"id-ID",
												{
													day: "numeric",
													month: "short",
												},
											);
										}}
										fontSize={12}
									/>
									<YAxis
										tickFormatter={formatShortCurrency}
										fontSize={12}
									/>
									<ChartTooltip
										content={
											<ChartTooltipContent
												formatter={(value, name) => (
													<span>
														{name === "income"
															? "Pemasukan"
															: "Pengeluaran"}
														:{" "}
														{formatCurrency(
															Number(value),
														)}
													</span>
												)}
											/>
										}
									/>
									<ChartLegend
										content={<ChartLegendContent />}
									/>
									<Bar
										dataKey="income"
										fill="var(--color-income)"
										radius={[4, 4, 0, 0]}
									/>
									<Bar
										dataKey="expense"
										fill="var(--color-expense)"
										radius={[4, 4, 0, 0]}
									/>
								</BarChart>
							</ChartContainer>
						) : (
							<div className="h-[300px] flex items-center justify-center text-muted-foreground">
								Tidak ada data untuk periode ini
							</div>
						)}
					</CardContent>
				</Card>

				{/* Net Flow Chart */}
				<Card>
					<CardHeader>
						<CardTitle>Saldo Bersih Harian</CardTitle>
						<CardDescription>
							Selisih pemasukan dan pengeluaran per hari
						</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<Skeleton className="h-[300px] w-full" />
						) : data?.dailyTrends && data.dailyTrends.length > 0 ? (
							<ChartContainer
								config={netChartConfig}
								className="h-[300px] w-full"
							>
								<BarChart data={data.dailyTrends}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis
										dataKey="date"
										tickFormatter={(value) => {
											const date = new Date(value);
											return date.toLocaleDateString(
												"id-ID",
												{
													day: "numeric",
													month: "short",
												},
											);
										}}
										fontSize={12}
									/>
									<YAxis
										tickFormatter={formatShortCurrency}
										fontSize={12}
									/>
									<ChartTooltip
										content={
											<ChartTooltipContent
												formatter={(value) => (
													<span>
														Saldo:{" "}
														{formatCurrency(
															Number(value),
														)}
													</span>
												)}
											/>
										}
									/>
									<Bar dataKey="net" radius={[4, 4, 0, 0]}>
										{data.dailyTrends.map((entry) => (
											<Cell
												key={`cell-${entry.date}`}
												fill={
													entry.net >= 0
														? "hsl(142, 76%, 36%)"
														: "hsl(0, 84%, 60%)"
												}
											/>
										))}
									</Bar>
								</BarChart>
							</ChartContainer>
						) : (
							<div className="h-[300px] flex items-center justify-center text-muted-foreground">
								Tidak ada data untuk periode ini
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Monthly Trends (for longer periods) */}
			{data?.monthlyTrends && data.monthlyTrends.length > 1 && (
				<Card>
					<CardHeader>
						<CardTitle>Tren Bulanan</CardTitle>
						<CardDescription>
							Ringkasan pemasukan dan pengeluaran per bulan
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ChartContainer
							config={trendChartConfig}
							className="h-[300px] w-full"
						>
							<BarChart data={data.monthlyTrends}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis
									dataKey="month"
									tickFormatter={(value) => {
										const [year, month] = value.split("-");
										const date = new Date(
											Number(year),
											Number(month) - 1,
										);
										return date.toLocaleDateString(
											"id-ID",
											{
												month: "short",
												year: "2-digit",
											},
										);
									}}
									fontSize={12}
								/>
								<YAxis
									tickFormatter={formatShortCurrency}
									fontSize={12}
								/>
								<ChartTooltip
									content={
										<ChartTooltipContent
											formatter={(value, name) => (
												<span>
													{name === "income"
														? "Pemasukan"
														: "Pengeluaran"}
													:{" "}
													{formatCurrency(
														Number(value),
													)}
												</span>
											)}
										/>
									}
								/>
								<ChartLegend content={<ChartLegendContent />} />
								<Bar
									dataKey="income"
									fill="var(--color-income)"
									radius={[4, 4, 0, 0]}
								/>
								<Bar
									dataKey="expense"
									fill="var(--color-expense)"
									radius={[4, 4, 0, 0]}
								/>
							</BarChart>
						</ChartContainer>
					</CardContent>
				</Card>
			)}

			{/* Category Breakdown Charts */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Expense Breakdown */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<TbCash className="text-red-500" />
							Pengeluaran per Kategori
						</CardTitle>
						<CardDescription>
							Distribusi pengeluaran berdasarkan kategori
						</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<Skeleton className="h-[300px] w-full" />
						) : data?.expenseBreakdown &&
							data.expenseBreakdown.length > 0 ? (
							<div className="flex flex-col lg:flex-row gap-4">
								<ChartContainer
									config={expenseChartConfig}
									className="h-[300px] w-full lg:w-1/2"
								>
									<PieChart>
										<ChartTooltip
											content={
												<ChartTooltipContent
													formatter={(
														value,
														name,
													) => (
														<span>
															{name}:{" "}
															{formatCurrency(
																Number(value),
															)}
														</span>
													)}
												/>
											}
										/>
										<Pie
											data={data.expenseBreakdown}
											dataKey="total"
											nameKey="categoryName"
											cx="50%"
											cy="50%"
											innerRadius={60}
											outerRadius={100}
											paddingAngle={2}
										>
											{data.expenseBreakdown.map(
												(entry, index) => (
													<Cell
														key={
															entry.categoryId ??
															`uncategorized-expense-${index}`
														}
														fill={
															entry.categoryColor ||
															CHART_COLORS[
																index %
																	CHART_COLORS.length
															]
														}
													/>
												),
											)}
										</Pie>
									</PieChart>
								</ChartContainer>
								<div className="flex-1 space-y-2 max-h-[300px] overflow-auto">
									{data.expenseBreakdown.map(
										(item, index) => (
											<div
												key={
													item.categoryId ??
													`uncategorized-${index}`
												}
												className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
											>
												<div className="flex items-center gap-2">
													<div
														className="w-3 h-3 rounded-full"
														style={{
															backgroundColor:
																item.categoryColor ||
																CHART_COLORS[
																	index %
																		CHART_COLORS.length
																],
														}}
													/>
													<span className="text-sm">
														{item.categoryIcon}
													</span>
													<span className="text-sm font-medium">
														{item.categoryName}
													</span>
												</div>
												<div className="text-right">
													<p className="text-sm font-medium">
														{formatCurrency(
															item.total,
														)}
													</p>
													<p className="text-xs text-muted-foreground">
														{item.percentage}% •{" "}
														{item.count} transaksi
													</p>
												</div>
											</div>
										),
									)}
								</div>
							</div>
						) : (
							<div className="h-[300px] flex items-center justify-center text-muted-foreground">
								Tidak ada data pengeluaran untuk periode ini
							</div>
						)}
					</CardContent>
				</Card>

				{/* Income Breakdown */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<TbCash className="text-green-500" />
							Pemasukan per Kategori
						</CardTitle>
						<CardDescription>
							Distribusi pemasukan berdasarkan kategori
						</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<Skeleton className="h-[300px] w-full" />
						) : data?.incomeBreakdown &&
							data.incomeBreakdown.length > 0 ? (
							<div className="flex flex-col lg:flex-row gap-4">
								<ChartContainer
									config={incomeChartConfig}
									className="h-[300px] w-full lg:w-1/2"
								>
									<PieChart>
										<ChartTooltip
											content={
												<ChartTooltipContent
													formatter={(
														value,
														name,
													) => (
														<span>
															{name}:{" "}
															{formatCurrency(
																Number(value),
															)}
														</span>
													)}
												/>
											}
										/>
										<Pie
											data={data.incomeBreakdown}
											dataKey="total"
											nameKey="categoryName"
											cx="50%"
											cy="50%"
											innerRadius={60}
											outerRadius={100}
											paddingAngle={2}
										>
											{data.incomeBreakdown.map(
												(entry, index) => (
													<Cell
														key={
															entry.categoryId ??
															`uncategorized-income-${index}`
														}
														fill={
															entry.categoryColor ||
															CHART_COLORS[
																index %
																	CHART_COLORS.length
															]
														}
													/>
												),
											)}
										</Pie>
									</PieChart>
								</ChartContainer>
								<div className="flex-1 space-y-2 max-h-[300px] overflow-auto">
									{data.incomeBreakdown.map((item, index) => (
										<div
											key={
												item.categoryId ??
												`uncategorized-${index}`
											}
											className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
										>
											<div className="flex items-center gap-2">
												<div
													className="w-3 h-3 rounded-full"
													style={{
														backgroundColor:
															item.categoryColor ||
															CHART_COLORS[
																index %
																	CHART_COLORS.length
															],
													}}
												/>
												<span className="text-sm">
													{item.categoryIcon}
												</span>
												<span className="text-sm font-medium">
													{item.categoryName}
												</span>
											</div>
											<div className="text-right">
												<p className="text-sm font-medium">
													{formatCurrency(item.total)}
												</p>
												<p className="text-xs text-muted-foreground">
													{item.percentage}% •{" "}
													{item.count} transaksi
												</p>
											</div>
										</div>
									))}
								</div>
							</div>
						) : (
							<div className="h-[300px] flex items-center justify-center text-muted-foreground">
								Tidak ada data pemasukan untuk periode ini
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

// Summary Card Component
interface SummaryCardProps {
	title: string;
	value: number;
	icon: React.ComponentType<{ className?: string }>;
	isLoading: boolean;
	variant: "income" | "expense" | "neutral";
	isCurrency?: boolean;
}

function SummaryCard({
	title,
	value,
	icon: Icon,
	isLoading,
	variant,
	isCurrency = true,
}: SummaryCardProps) {
	const variantStyles = {
		income: "text-green-600 bg-green-50 dark:bg-green-950/30",
		expense: "text-red-600 bg-red-50 dark:bg-red-950/30",
		neutral: "text-blue-600 bg-blue-50 dark:bg-blue-950/30",
	};

	return (
		<Card>
			<CardContent className="pt-6">
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<p className="text-sm text-muted-foreground">{title}</p>
						{isLoading ? (
							<Skeleton className="h-8 w-24" />
						) : (
							<p className="text-2xl font-bold">
								{isCurrency
									? formatCurrency(value)
									: value.toLocaleString("id-ID")}
							</p>
						)}
					</div>
					<div
						className={`p-3 rounded-full ${variantStyles[variant]}`}
					>
						<Icon className="h-6 w-6" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
