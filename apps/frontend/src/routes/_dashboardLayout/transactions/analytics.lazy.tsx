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
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	ScrollArea,
	Select,
	Skeleton,
} from "@repo/ui";
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import React, { useMemo, useState } from "react";
import {
	TbArrowLeft,
	TbArrowNarrowDown,
	TbArrowNarrowUp,
	TbCash,
	TbReceipt,
	TbTrendingDown,
	TbTrendingUp,
} from "react-icons/tb";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
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

// Custom Treemap Component using squarified algorithm
interface TreemapItem {
	categoryId: string | null;
	categoryName: string;
	categoryIcon: string | null;
	categoryColor: string | null;
	total: number;
	percentage: number | string;
	count: number;
}

interface TreemapRect {
	x: number;
	y: number;
	width: number;
	height: number;
	item: TreemapItem;
}

function calculateTreemap(
	items: TreemapItem[],
	width: number,
	height: number,
): TreemapRect[] {
	if (items.length === 0 || width <= 0 || height <= 0) return [];

	const sortedItems = [...items].sort((a, b) => b.total - a.total);

	const rects: TreemapRect[] = [];
	let remainingItems = sortedItems;
	let x = 0;
	let y = 0;
	let remainingWidth = width;
	let remainingHeight = height;

	while (remainingItems.length > 0) {
		const isHorizontal = remainingWidth >= remainingHeight;
		const remainingTotal = remainingItems.reduce(
			(sum, item) => sum + item.total,
			0,
		);

		// Find the best row/column
		let row: TreemapItem[] = [];
		let bestWorst = Number.MAX_VALUE;

		for (let i = 1; i <= remainingItems.length; i++) {
			const testRow = remainingItems.slice(0, i);
			const rowTotal = testRow.reduce((sum, item) => sum + item.total, 0);

			const side = isHorizontal
				? (rowTotal / remainingTotal) * remainingWidth
				: (rowTotal / remainingTotal) * remainingHeight;

			const worstRatio = testRow.reduce((worst, item) => {
				const itemArea =
					(item.total / remainingTotal) *
					remainingWidth *
					remainingHeight;
				const itemSide = itemArea / side;
				const ratio = Math.max(side / itemSide, itemSide / side);
				return Math.max(worst, ratio);
			}, 0);

			if (worstRatio <= bestWorst) {
				bestWorst = worstRatio;
				row = testRow;
			} else {
				break;
			}
		}

		// Safety check - if row is empty, take at least one item
		if (row.length === 0) {
			row = [remainingItems[0]];
		}

		// Layout the row
		const rowTotal = row.reduce((sum, item) => sum + item.total, 0);
		const rowSize = isHorizontal
			? (rowTotal / remainingTotal) * remainingWidth
			: (rowTotal / remainingTotal) * remainingHeight;

		let offset = 0;
		for (const item of row) {
			const itemSize =
				(item.total / rowTotal) *
				(isHorizontal ? remainingHeight : remainingWidth);

			rects.push({
				x: isHorizontal ? x : x + offset,
				y: isHorizontal ? y + offset : y,
				width: isHorizontal ? rowSize : itemSize,
				height: isHorizontal ? itemSize : rowSize,
				item,
			});

			offset += itemSize;
		}

		// Update remaining area
		if (isHorizontal) {
			x += rowSize;
			remainingWidth -= rowSize;
		} else {
			y += rowSize;
			remainingHeight -= rowSize;
		}

		remainingItems = remainingItems.slice(row.length);
	}

	return rects;
}

interface CustomTreemapProps {
	data: TreemapItem[];
	height?: number;
	onCategoryClick?: (item: TreemapItem) => void;
}

function CustomTreemap({
	data,
	height = 350,
	onCategoryClick,
}: CustomTreemapProps) {
	const containerRef = React.useRef<HTMLDivElement>(null);
	const [dimensions, setDimensions] = React.useState({ width: 0, height });

	React.useEffect(() => {
		const updateDimensions = () => {
			if (containerRef.current) {
				setDimensions({
					width: containerRef.current.offsetWidth,
					height,
				});
			}
		};

		updateDimensions();
		window.addEventListener("resize", updateDimensions);
		return () => window.removeEventListener("resize", updateDimensions);
	}, [height]);

	const rects = React.useMemo(
		() => calculateTreemap(data, dimensions.width, dimensions.height),
		[data, dimensions.width, dimensions.height],
	);

	return (
		<div
			ref={containerRef}
			className="relative w-full rounded-lg overflow-hidden"
			style={{ height }}
		>
			{rects.map((rect, index) => {
				const showName = rect.width > 70 && rect.height > 45;
				const showAmount = rect.width > 90 && rect.height > 65;
				const showPercentage = rect.width > 110 && rect.height > 85;

				return (
					<button
						type="button"
						key={rect.item.categoryId ?? `item-${index}`}
						className="absolute flex flex-col items-center justify-center p-2 transition-all hover:brightness-110 cursor-pointer group"
						style={{
							left: rect.x,
							top: rect.y,
							width: rect.width,
							height: rect.height,
							backgroundColor:
								rect.item.categoryColor ||
								CHART_COLORS[index % CHART_COLORS.length],
							border: "2px solid hsl(var(--background))",
							borderRadius: "4px",
						}}
						title={`${rect.item.categoryIcon || ""} ${rect.item.categoryName}: ${formatCurrency(rect.item.total)} (${rect.item.percentage}%)`}
						onClick={() => onCategoryClick?.(rect.item)}
					>
						{showName && (
							<span
								className="text-white font-semibold text-center leading-tight drop-shadow-md"
								style={{
									fontSize: Math.min(14, rect.width / 9),
									textShadow: "0 1px 3px rgba(0,0,0,0.5)",
								}}
							>
								{rect.item.categoryIcon}{" "}
								{rect.item.categoryName}
							</span>
						)}
						{showAmount && (
							<span
								className="text-white font-medium text-center drop-shadow-md"
								style={{
									fontSize: Math.min(13, rect.width / 10),
									textShadow: "0 1px 2px rgba(0,0,0,0.5)",
								}}
							>
								{formatCurrency(rect.item.total)}
							</span>
						)}
						{showPercentage && (
							<span
								className="text-white/90 text-center drop-shadow-md"
								style={{
									fontSize: Math.min(11, rect.width / 12),
									textShadow: "0 1px 2px rgba(0,0,0,0.5)",
								}}
							>
								{rect.item.percentage}% • {rect.item.count}{" "}
								transaksi
							</span>
						)}
					</button>
				);
			})}
		</div>
	);
}

interface CategoryDetailListProps {
	data: TreemapItem[];
	onCategoryClick?: (item: TreemapItem) => void;
}

function CategoryDetailList({
	data,
	onCategoryClick,
}: CategoryDetailListProps) {
	const sortedData = [...data].sort((a, b) => b.total - a.total);

	return (
		<div className="mt-4 space-y-2">
			<div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 text-xs font-semibold text-muted-foreground border-b pb-2">
				<span>Kategori</span>
				<span className="text-right">Transaksi</span>
				<span className="text-right">Total</span>
				<span className="text-right w-14">Persen</span>
			</div>
			<div className="space-y-1 max-h-[200px] overflow-y-auto">
				{sortedData.map((item, index) => (
					<button
						type="button"
						key={item.categoryId ?? `detail-${index}`}
						className="w-full grid grid-cols-[1fr_auto_auto_auto] gap-2 text-sm py-1.5 hover:bg-muted/50 rounded px-1 cursor-pointer transition-colors text-left"
						onClick={() => onCategoryClick?.(item)}
					>
						<div className="flex items-center gap-2">
							<div
								className="w-3 h-3 rounded-sm flex-shrink-0"
								style={{
									backgroundColor:
										item.categoryColor ||
										CHART_COLORS[
											index % CHART_COLORS.length
										],
								}}
							/>
							<span className="truncate">
								{item.categoryIcon} {item.categoryName}
							</span>
						</div>
						<span className="text-right text-muted-foreground">
							{item.count}x
						</span>
						<span className="text-right font-medium">
							{formatCurrency(item.total)}
						</span>
						<span className="text-right text-muted-foreground w-14">
							{item.percentage}%
						</span>
					</button>
				))}
			</div>
		</div>
	);
}

export default function AnalyticsPage() {
	const [quickRange, setQuickRange] = useState("30d");
	const [customDateRange, setCustomDateRange] = useState<
		DateRange | undefined
	>(undefined);
	const [selectedCategory, setSelectedCategory] =
		useState<TreemapItem | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);

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

	// Fetch transactions for selected category
	const { data: categoryTransactions, isLoading: isLoadingTransactions } =
		useQuery({
			queryKey: [
				"category-transactions",
				selectedCategory?.categoryId,
				effectiveDateRange.from?.toISOString(),
				effectiveDateRange.to?.toISOString(),
			],
			queryFn: async () => {
				if (!selectedCategory?.categoryId)
					return { data: [], total: 0 };
				const res = await client.money.transactions.$get({
					query: {
						categoryId: selectedCategory.categoryId,
						startDate: effectiveDateRange.from?.toISOString(),
						endDate: effectiveDateRange.to?.toISOString(),
						page: "1",
						limit: "100",
						sort: JSON.stringify([{ id: "date", desc: true }]),
					},
				});
				if (!res.ok) throw new Error("Failed to fetch transactions");
				return res.json();
			},
			enabled: dialogOpen && !!selectedCategory?.categoryId,
		});

	const handleCategoryClick = (item: TreemapItem) => {
		setSelectedCategory(item);
		setDialogOpen(true);
	};

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
		<div className="h-full flex flex-col">
			<div className="flex-1 overflow-y-auto">
				<div className="p-6 pt-4 flex flex-col gap-6">
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
								(data?.summary.netFlow ?? 0) >= 0
									? "income"
									: "expense"
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
									<Skeleton className="h-[400px] w-full" />
								) : data?.dailyTrends &&
									data.dailyTrends.length > 0 ? (
									<ChartContainer
										config={trendChartConfig}
										className="h-[300px] w-full"
									>
										<BarChart data={data.dailyTrends}>
											<CartesianGrid strokeDasharray="3 3" />
											<XAxis
												dataKey="date"
												tickFormatter={(value) => {
													const date = new Date(
														value,
													);
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
												tickFormatter={
													formatShortCurrency
												}
												fontSize={12}
											/>
											<ChartTooltip
												content={
													<ChartTooltipContent
														formatter={(
															value,
															name,
														) => (
															<span>
																{name ===
																"income"
																	? "Pemasukan"
																	: "Pengeluaran"}
																:{" "}
																{formatCurrency(
																	Number(
																		value,
																	),
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
									<Skeleton className="h-[400px] w-full" />
								) : data?.dailyTrends &&
									data.dailyTrends.length > 0 ? (
									<ChartContainer
										config={netChartConfig}
										className="h-[300px] w-full"
									>
										<BarChart data={data.dailyTrends}>
											<CartesianGrid strokeDasharray="3 3" />
											<XAxis
												dataKey="date"
												tickFormatter={(value) => {
													const date = new Date(
														value,
													);
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
												tickFormatter={
													formatShortCurrency
												}
												fontSize={12}
											/>
											<ChartTooltip
												content={
													<ChartTooltipContent
														formatter={(value) => (
															<span>
																Saldo:{" "}
																{formatCurrency(
																	Number(
																		value,
																	),
																)}
															</span>
														)}
													/>
												}
											/>
											<Bar
												dataKey="net"
												radius={[4, 4, 0, 0]}
											>
												{data.dailyTrends.map(
													(entry) => (
														<Cell
															key={`cell-${entry.date}`}
															fill={
																entry.net >= 0
																	? "hsl(142, 76%, 36%)"
																	: "hsl(0, 84%, 60%)"
															}
														/>
													),
												)}
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
									Ringkasan pemasukan dan pengeluaran per
									bulan
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
												const [year, month] =
													value.split("-");
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
													formatter={(
														value,
														name,
													) => (
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
									<Skeleton className="h-[350px] w-full" />
								) : data?.expenseBreakdown &&
									data.expenseBreakdown.length > 0 ? (
									<>
										<CustomTreemap
											data={data.expenseBreakdown}
											height={350}
											onCategoryClick={
												handleCategoryClick
											}
										/>
										<CategoryDetailList
											data={data.expenseBreakdown}
											onCategoryClick={
												handleCategoryClick
											}
										/>
									</>
								) : (
									<div className="h-[350px] flex items-center justify-center text-muted-foreground">
										Tidak ada data pengeluaran untuk periode
										ini
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
									<Skeleton className="h-[350px] w-full" />
								) : data?.incomeBreakdown &&
									data.incomeBreakdown.length > 0 ? (
									<>
										<CustomTreemap
											data={data.incomeBreakdown}
											height={350}
											onCategoryClick={
												handleCategoryClick
											}
										/>
										<CategoryDetailList
											data={data.incomeBreakdown}
											onCategoryClick={
												handleCategoryClick
											}
										/>
									</>
								) : (
									<div className="h-[350px] flex items-center justify-center text-muted-foreground">
										Tidak ada data pemasukan untuk periode
										ini
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			</div>

			{/* Category Transactions Dialog */}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="max-w-2xl max-h-[80vh]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							{selectedCategory && (
								<>
									<div
										className="w-4 h-4 rounded-sm"
										style={{
											backgroundColor:
												selectedCategory.categoryColor ||
												CHART_COLORS[0],
										}}
									/>
									<span>
										{selectedCategory.categoryIcon}{" "}
										{selectedCategory.categoryName}
									</span>
								</>
							)}
						</DialogTitle>
					</DialogHeader>

					{selectedCategory && (
						<div className="space-y-4">
							{/* Summary */}
							<div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
								<div className="text-center">
									<p className="text-sm text-muted-foreground">
										Total
									</p>
									<p className="text-lg font-bold">
										{formatCurrency(selectedCategory.total)}
									</p>
								</div>
								<div className="text-center">
									<p className="text-sm text-muted-foreground">
										Transaksi
									</p>
									<p className="text-lg font-bold">
										{selectedCategory.count}x
									</p>
								</div>
								<div className="text-center">
									<p className="text-sm text-muted-foreground">
										Persentase
									</p>
									<p className="text-lg font-bold">
										{selectedCategory.percentage}%
									</p>
								</div>
							</div>

							{/* Transaction List */}
							<div>
								<p className="text-sm font-semibold mb-2">
									Daftar Transaksi
								</p>
								<ScrollArea className="h-[350px]">
									{isLoadingTransactions ? (
										<div className="space-y-2">
											{[...Array(5)].map((_, i) => (
												<Skeleton
													key={`skeleton-${i.toString()}`}
													className="h-16 w-full"
												/>
											))}
										</div>
									) : categoryTransactions?.data &&
										categoryTransactions.data.length > 0 ? (
										<div className="space-y-2 pr-4">
											{categoryTransactions.data.map(
												(tx) => (
													<div
														key={tx.id}
														className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
													>
														<div className="flex-1 min-w-0">
															<p className="font-medium truncate">
																{tx.description ||
																	"Tanpa deskripsi"}
															</p>
															<p className="text-sm text-muted-foreground">
																{new Date(
																	tx.date,
																).toLocaleDateString(
																	"id-ID",
																	{
																		weekday:
																			"short",
																		day: "numeric",
																		month: "short",
																		year: "numeric",
																	},
																)}
															</p>
														</div>
														<p
															className={`font-semibold ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}
														>
															{tx.type ===
															"income"
																? "+"
																: "-"}
															{formatCurrency(
																Number(
																	tx.amount,
																),
															)}
														</p>
													</div>
												),
											)}
										</div>
									) : (
										<div className="flex items-center justify-center h-[200px] text-muted-foreground">
											Tidak ada transaksi ditemukan
										</div>
									)}
								</ScrollArea>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
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
