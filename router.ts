import { createRouter } from "./middleware";
import { authRouter } from "./routers/auth";
import { projectRouter } from "./routers/project";
import { userRouter } from "./routers/user";
import { settingRouter } from "./routers/setting";
import { analyticsRouter } from "./routers/analytics";
import { dashboardRouter } from "./routers/dashboard";
import { honorRouter } from "./routers/honor";

export const appRouter = createRouter({
  auth: authRouter,
  project: projectRouter,
  user: userRouter,
  setting: settingRouter,
  analytics: analyticsRouter,
  dashboard: dashboardRouter,
  honor: honorRouter,
});

export type AppRouter = typeof appRouter;
