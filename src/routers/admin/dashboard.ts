import {Router} from "express";
import {DashboardView} from "../../ui/admin/views/dashboard.js";
import {type AdminDeps, loadUser, send} from "./lib.js";

export function dashboardRouter(deps: AdminDeps): Router {
    const router = Router();

    router.get("/", async (req, res) => {
        const user = await loadUser(deps, req);
        if (!user) return res.redirect(302, "/admin/login");

        const [pages, posts, messages] = await Promise.all([
            deps.pageRepo.list({}),
            deps.postRepo.list({}, {}),
            deps.contactRepo.list({}),
        ]);

        const unread = messages.ok
            ? messages.data.data.filter((m) => !m.read).length
            : 0;

        send(
            res,
            DashboardView({
                user,
                currentPath: "/admin",
                counts: {
                    pages: pages.ok ? pages.data.total : 0,
                    posts: posts.ok ? posts.data.total : 0,
                    messages: messages.ok ? messages.data.total : 0,
                    unreadMessages: unread,
                },
            })
        );
    });

    return router;
}
