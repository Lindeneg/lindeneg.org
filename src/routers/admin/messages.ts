import {Router} from "express";
import {parsePagination, toSkipTake} from "../../lib/pagination.js";
import {MessagesListView} from "../../ui/admin/views/messages-list.js";
import {type AdminDeps, loadUser, send} from "./lib.js";

export function messagesRouter(deps: AdminDeps): Router {
    const router = Router();

    router.get("/messages", async (req, res) => {
        const user = await loadUser(deps, req);
        if (!user) return res.redirect(302, "/admin/login");
        const pagination = parsePagination(req);
        const result = await deps.contactRepo.list(toSkipTake(pagination));
        if (!result.ok) return send(res, "Failed", 500);
        const totalPages = Math.max(1, Math.ceil(result.data.total / pagination.pageSize));
        send(
            res,
            MessagesListView({
                user,
                currentPath: "/admin/messages",
                messages: result.data.data,
                page: pagination.page,
                totalPages,
            })
        );
    });

    router.post("/messages/:id/toggle-read", async (req, res) => {
        const all = await deps.contactRepo.list({});
        if (!all.ok) return send(res, "Failed", 500);
        const found = all.data.data.find((m) => m.id === req.params.id);
        if (!found) return send(res, "Not found", 404);
        const result = await deps.contactRepo.update(req.params.id, {read: !found.read});
        if (!result.ok) return send(res, "Failed", 500);
        res.redirect(302, "/admin/messages");
    });

    router.post("/messages/:id/delete", async (req, res) => {
        const result = await deps.contactRepo.delete(req.params.id);
        if (!result.ok) return send(res, "Failed", 500);
        res.redirect(302, "/admin/messages");
    });

    return router;
}
