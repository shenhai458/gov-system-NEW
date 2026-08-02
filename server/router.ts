import { createRouter } from "./middleware.js";
import { authRouter } from "./routers/auth.js";
import { projectRouter } from "./routers/project.js";
import { userRouter } from "./routers/user.js";
import { settingRouter } from "./routers/setting.js";
import { analyticsRouter } from "./routers/analytics.js";
import { dashboardRouter } from "./routers/dashboard.js";
import { honorRouter } from "./routers/honor.js";

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
