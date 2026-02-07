"use client";

import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	Row,
	useReactTable,
} from "@tanstack/react-table";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "./ui/table";

import React, { useMemo, useState } from "react";
import {
	closestCenter,
	DndContext,
	DragOverlay,
	DragEndEvent,
	DragStartEvent,
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	UniqueIdentifier,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
	arrayMove,
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface DraggableData {
	id: string;
	[key: string]: unknown;
}

interface DraggableDataTableProps<TData extends DraggableData> {
    columns: ColumnDef<TData, unknown>[];
    data: TData[];
    onReorder?: (reorderedData: TData[]) => void;
}

interface DraggableRowProps<TData extends DraggableData> {
	row: Row<TData>;
	children: React.ReactNode;
}

function DraggableRow<TData extends DraggableData>({ row, children }: DraggableRowProps<TData>) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: row.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<TableRow ref={setNodeRef} style={style}>
			<TableCell className="w-12 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
				<GripVertical className="h-5 w-5 text-gray-400 m-auto" />
			</TableCell>
			{children}
		</TableRow>
	);
}

export function DraggableDataTable<TData extends DraggableData>({
	columns, data, onReorder,
}: DraggableDataTableProps<TData>) {
	const [ activeId, setActiveId ] = useState<UniqueIdentifier | null>(null);
	const items = useMemo(() => data.map(({ id }) => id), [data]);

	// eslint-disable-next-line react-hooks/incompatible-library
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	const sensors = useSensors(
		useSensor(MouseSensor, {}),
		useSensor(TouchSensor, {}),
		useSensor(KeyboardSensor, {}),
	);

	function handleDragStart(ev: DragStartEvent) {
		setActiveId(ev.active.id);
	}

	function handleDragEnd(ev: DragEndEvent) {
		const { active, over } = ev;

		if (active.id !== over?.id) {
			const oldIndex = table.getRowModel().rows.findIndex(row => row.id === active.id);
			const newIndex = table.getRowModel().rows.findIndex(row => row.id === over?.id);
			const reorderedData = arrayMove(data, oldIndex, newIndex);

			if (onReorder) {
				onReorder(reorderedData);
			}
		}

		setActiveId(null);
	}

	function handleDragCancel() {
		setActiveId(null);
	}

	return (
		<div className="overflow-hidden rounded-lg border shadow-lg w-full mt-2">
			<DndContext
				sensors={sensors}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
				onDragCancel={handleDragCancel}
				collisionDetection={closestCenter}
				modifiers={[restrictToVerticalAxis]}
			>
				<Table>
					<TableHeader>
						{ table.getHeaderGroups().map(group => (
							<TableRow key={group.id}>
								<TableHead className="w-12"></TableHead>
								{ group.headers.map(header => (
									<TableHead key={header.id} className={ !header.column.columnDef.header ? "w-0" : "" }>
										{ header.isPlaceholder
											? null
											: flexRender(
												header.column.columnDef.header,
												header.getContext(),
											)
										}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						<SortableContext items={items} strategy={verticalListSortingStrategy}>
							{ table.getRowModel().rows?.length
								? table.getRowModel().rows.map((row) => (
									<DraggableRow key={row.id} row={row}>
										{ row.getVisibleCells().map(cell => (
											<TableCell key={cell.id}>
												{ flexRender(cell.column.columnDef.cell, cell.getContext())}
											</TableCell>
										))}
									</DraggableRow>
								)) : (
									<TableRow>
										<TableCell colSpan={columns.length + 1}>
									No results...
										</TableCell>
									</TableRow>
								)
							}
						</SortableContext>
					</TableBody>
				</Table>
				<DragOverlay>
					{ activeId && (
						<table style={{ width: "100%" }}>
							<tbody>
								{ table.getRowModel().rows
									.filter(row => row.id === activeId)
									.map(row => (
										<tr key={row.id} className="bg-gray-800">
											<td className="p-2 border w-12">
												<GripVertical className="h-5 w-5 text-gray-400" />
											</td>
											{ row.getVisibleCells()
												.filter(cell => cell.column.id !== "actions")
												.map(cell => (
													<td key={cell.id} className={ "p-2 border text-center" }>
														{ flexRender(cell.column.columnDef.cell, cell.getContext())}
													</td>
												))}
										</tr>
									))
								}
							</tbody>
						</table>
					)}
				</DragOverlay>
			</DndContext>
		</div>
	);
}