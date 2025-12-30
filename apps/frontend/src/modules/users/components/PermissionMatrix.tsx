import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Badge,
	Card,
	Checkbox,
	Input,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@repo/ui";
import { useMemo, useState } from "react";
import {
	TbLock,
	TbSearch,
	TbShieldCheck,
	TbShieldLock,
} from "react-icons/tb";

interface Permission {
	id: string;
	code: string;
	description?: string | null;
}

interface Role {
	id: string;
	name: string;
	permissions: string[];
}

interface PermissionMatrixProps {
	permissions: Permission[];
	roles: Role[];
	selectedRoleIds: string[];
	selectedPermissionIds: string[];
	onChange: (ids: string[]) => void;
	disabled?: boolean;
	assignPermissions?: React.ReactNode;
}

export default function PermissionMatrix({
	permissions,
	roles,
	selectedRoleIds,
	selectedPermissionIds,
	onChange,
	disabled = false,
	assignPermissions,
}: PermissionMatrixProps) {
	const [search, setSearch] = useState("");

	// 1. Hitung Inherited Permissions
	const inheritedPermissionIds = useMemo(() => {
		const ids = new Set<string>();
		const activeRoles = roles.filter((r) =>
			selectedRoleIds.includes(r.id),
		);
		activeRoles.forEach((role) => {
			role.permissions.forEach((pId) => ids.add(pId));
		});
		return ids;
	}, [roles, selectedRoleIds]);

	// 2. Filter & Group Permissions
	const groupedPermissions = useMemo(() => {
		const groups: Record<string, Permission[]> = {};

		// Filter by search text first
		const filtered = permissions.filter(
			(p) =>
				p.code.toLowerCase().includes(search.toLowerCase()) ||
				p.description?.toLowerCase().includes(search.toLowerCase()),
		);

		filtered.forEach((perm) => {
			const groupName = perm.code.split(".")[0] || "General";
			const formattedName =
				groupName.charAt(0).toUpperCase() + groupName.slice(1);

			if (!groups[formattedName]) groups[formattedName] = [];
			groups[formattedName].push(perm);
		});
		return groups;
	}, [permissions, search]);

	const handleToggle = (permId: string) => {
		if (inheritedPermissionIds.has(permId)) return;
		const newSelection = new Set(selectedPermissionIds);
		if (newSelection.has(permId)) newSelection.delete(permId);
		else newSelection.add(permId);
		onChange(Array.from(newSelection));
	};

	return (
		<Card className="overflow-hidden bg-gray-50/50 p-0 border rounded-md">
			{/* Header Section */}
			<div className="p-4 border-b bg-white flex flex-col sm:flex-row gap-4 justify-between items-center">
				<div>
					<div className="flex items-center gap-2">
						<div className="flex items-center justify-center rounded bg-violet-100 text-violet-600 w-8 h-8">
							<TbShieldLock />
						</div>
						<span className="font-semibold text-sm">
							Fine-Grained Permissions
						</span>
					</div>
					{!assignPermissions ? (
						<p className="text-red-500 text-xs mt-1">
							You do not have permission to modify these settings.
						</p>
					) : (
						<p className="text-muted-foreground text-xs mt-1">
							Manage extra permissions beyond the assigned roles.
						</p>
					)}
				</div>
				<div className="w-full sm:w-64 relative">
					<div className="absolute left-2.5 top-2.5 text-muted-foreground">
						<TbSearch size={14} />
					</div>
					<Input
						placeholder="Search permissions..."
						value={search}
						onChange={(e) => setSearch(e.currentTarget.value)}
						className="pl-8 text-xs h-9"
					/>
				</div>
			</div>

			{/* Accordion List */}
			<div className="p-4">
				{Object.keys(groupedPermissions).length === 0 ? (
					<div className="text-muted-foreground text-sm text-center py-10">
						No permissions found matching {search && search}
					</div>
				) : (
					<Accordion
						type="single"
						collapsible
						defaultValue={Object.keys(groupedPermissions)[0]}
						className="space-y-2"
					>
						{Object.entries(groupedPermissions).map(
							([group, perms]) => {
								// Count active perms in this group
								const activeCount = perms.filter(
									(p) =>
										inheritedPermissionIds.has(p.id) ||
										selectedPermissionIds.includes(p.id),
								).length;

								return (
									<AccordionItem
										key={group}
										value={group}
										className="bg-white border rounded-md px-3"
									>
										<AccordionTrigger className="hover:no-underline py-3">
											<div className="flex justify-between w-full mr-2">
												<div className="flex items-center gap-2">
													<span className="font-medium text-sm">
														{group}
													</span>
													<Badge
														variant={
															activeCount > 0
																? "default"
																: "secondary"
														}
														className={
															activeCount > 0
																? "bg-green-100 text-green-700 hover:bg-green-100 border-none"
																: ""
														}
													>
														{activeCount}/
														{perms.length} Active
													</Badge>
												</div>
											</div>
										</AccordionTrigger>
										<AccordionContent className="pb-3 pt-1">
											<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
												{perms.map((perm) => {
													const isInherited =
														inheritedPermissionIds.has(
															perm.id,
														);
													const isManual =
														selectedPermissionIds.includes(
															perm.id,
														);
													const isChecked =
														isInherited || isManual;

													return (
														<div
															key={perm.id}
															className={`
                                                                flex items-start gap-3 p-2 rounded-md border transition-colors
                                                                ${isChecked ? (isInherited ? "bg-gray-50 border-gray-200" : "bg-blue-50 border-blue-200") : "hover:bg-gray-50 border-transparent"}
                                                            `}
														>
															<Checkbox
																checked={
																	isChecked
																}
																onCheckedChange={() =>
																	handleToggle(
																		perm.id,
																	)
																}
																disabled={
																	disabled ||
																	isInherited
																}
																className={
																	isInherited
																		? "data-[state=checked]:bg-gray-400 data-[state=checked]:border-gray-400 mt-1"
																		: "data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 mt-1"
																}
															/>
															<div className="flex-1">
																<div className="flex items-center gap-1.5 mb-0.5">
																	<span
																		className={`text-sm font-medium leading-none ${isChecked ? "text-foreground" : "text-muted-foreground"}`}
																	>
																		{
																			perm.code
																		}
																	</span>
																	{isInherited && (
																		<TooltipProvider>
																			<Tooltip>
																				<TooltipTrigger>
																					<div className="text-gray-400">
																						<TbLock
																							size={
																								12
																							}
																						/>
																					</div>
																				</TooltipTrigger>
																				<TooltipContent>
																					<p>
																						Granted
																						by
																						Role
																					</p>
																				</TooltipContent>
																			</Tooltip>
																		</TooltipProvider>
																	)}
																	{isManual && (
																		<TooltipProvider>
																			<Tooltip>
																				<TooltipTrigger>
																					<div className="text-blue-500">
																						<TbShieldCheck
																							size={
																								12
																							}
																						/>
																					</div>
																				</TooltipTrigger>
																				<TooltipContent>
																					<p>
																						Manually
																						Granted
																					</p>
																				</TooltipContent>
																			</Tooltip>
																		</TooltipProvider>
																	)}
																</div>
																<p className="text-xs text-muted-foreground line-clamp-1">
																	{perm.description ||
																		"No description provided."}
																</p>
															</div>
														</div>
													);
												})}
											</div>
										</AccordionContent>
									</AccordionItem>
								);
							},
						)}
					</Accordion>
				)}
			</div>
		</Card>
	);
}
