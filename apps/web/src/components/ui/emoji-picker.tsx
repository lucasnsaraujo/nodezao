import EmojiPicker from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";

interface EmojiPickerButtonProps {
	emoji: string;
	onEmojiSelect: (emoji: string) => void;
}

export function EmojiPickerButton({
	emoji,
	onEmojiSelect,
}: EmojiPickerButtonProps) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline" className="h-10 w-16 text-2xl">
					{emoji || "😀"}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<EmojiPicker
					onEmojiClick={(emojiData) => onEmojiSelect(emojiData.emoji)}
				/>
			</PopoverContent>
		</Popover>
	);
}
