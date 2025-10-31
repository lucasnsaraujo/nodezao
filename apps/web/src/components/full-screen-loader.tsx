import { Loader2 } from "lucide-react";
import { IconInnerShadowTop } from "@tabler/icons-react";

interface FullScreenLoaderProps {
	isVisible: boolean;
}

export function FullScreenLoader({ isVisible }: FullScreenLoaderProps) {
	if (!isVisible) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
			style={{ opacity: isVisible ? 1 : 0 }}
		>
			<div className="flex flex-col items-center gap-4">
				<div className="flex items-center gap-2 text-primary">
					<IconInnerShadowTop className="h-8 w-8" />
					<span className="text-2xl font-bold">AdScope</span>
				</div>
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		</div>
	);
}
