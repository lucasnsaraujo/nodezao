import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export interface ComboboxItem {
	value: string;
	label: string;
}

interface ComboboxWithCreateProps {
	items: ComboboxItem[];
	value?: string;
	onValueChange: (value: string) => void;
	onCreateNew: (name: string) => Promise<void> | void;
	placeholder?: string;
	searchPlaceholder?: string;
	emptyText?: string;
	createNewText?: string;
	disabled?: boolean;
}

export function ComboboxWithCreate({
	items,
	value,
	onValueChange,
	onCreateNew,
	placeholder = "Select item...",
	searchPlaceholder = "Search...",
	emptyText = "No item found.",
	createNewText = "Create",
	disabled = false,
}: ComboboxWithCreateProps) {
	const [open, setOpen] = React.useState(false);
	const [searchValue, setSearchValue] = React.useState("");
	const [isCreating, setIsCreating] = React.useState(false);

	const selectedItem = items.find((item) => item.value === value);

	const handleCreateNew = async () => {
		if (!searchValue.trim()) return;

		setIsCreating(true);
		try {
			await onCreateNew(searchValue.trim());
			setSearchValue("");
			setOpen(false);
		} catch (error) {
			console.error("Error creating new item:", error);
		} finally {
			setIsCreating(false);
		}
	};

	const showCreateButton =
		searchValue.trim() &&
		!items.some(
			(item) => item.label.toLowerCase() === searchValue.toLowerCase(),
		);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between"
					disabled={disabled}
				>
					{selectedItem ? selectedItem.label : placeholder}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-full p-0" align="start">
				<Command shouldFilter={false}>
					<CommandInput
						placeholder={searchPlaceholder}
						value={searchValue}
						onValueChange={setSearchValue}
					/>
					<CommandList>
						<CommandEmpty>
							<div className="py-2 text-center text-sm text-muted-foreground">
								{emptyText}
							</div>
						</CommandEmpty>
						<CommandGroup>
							{items
								.filter((item) =>
									item.label.toLowerCase().includes(searchValue.toLowerCase()),
								)
								.map((item) => (
									<CommandItem
										key={item.value}
										value={item.value}
										onSelect={(currentValue) => {
											onValueChange(currentValue === value ? "" : currentValue);
											setOpen(false);
											setSearchValue("");
										}}
									>
										<Check
											className={cn(
												"mr-2 h-4 w-4",
												value === item.value ? "opacity-100" : "opacity-0",
											)}
										/>
										{item.label}
									</CommandItem>
								))}
						</CommandGroup>
						{showCreateButton && (
							<CommandGroup>
								<CommandItem
									onSelect={handleCreateNew}
									disabled={isCreating}
									className="text-primary"
								>
									<Plus className="mr-2 h-4 w-4" />
									{createNewText} "{searchValue}"
									{isCreating && " ..."}
								</CommandItem>
							</CommandGroup>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
