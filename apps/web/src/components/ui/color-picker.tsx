import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { Input } from "./input";

interface ColorPickerProps {
	color: string;
	onChange: (color: string) => void;
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline" className="w-full justify-start gap-2">
					<div
						className="h-5 w-5 rounded border"
						style={{ backgroundColor: color }}
					/>
					<span className="flex-1 text-left font-mono text-sm">{color}</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-3">
				<div className="space-y-3">
					<HexColorPicker color={color} onChange={onChange} />
					<Input
						value={color}
						onChange={(e) => onChange(e.target.value)}
						className="font-mono"
						placeholder="#000000"
					/>
				</div>
			</PopoverContent>
		</Popover>
	);
}
