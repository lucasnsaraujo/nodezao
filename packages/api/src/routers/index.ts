import { protectedProcedure, publicProcedure, router } from "../index";
import { offerRouter } from "./offer";
import { snapshotRouter } from "./snapshot";
import { configRouter } from "./config";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	privateData: protectedProcedure.query(({ ctx }) => {
		return {
			message: "This is private",
			user: ctx.session.user,
		};
	}),
	offer: offerRouter,
	snapshot: snapshotRouter,
	config: configRouter,
});
export type AppRouter = typeof appRouter;
