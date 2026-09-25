import {Router} from "express";
import {send} from "../../lib/http.js";
import {parsePagination} from "../../lib/pagination.js";
import {getAuth} from "../../middleware/admin-auth.js";
import type MessageService from "../../services/message-service.js";
import {MessagesListView} from "../../ui/views/admin/messages-list.js";
import {sendActionError, sendLoadError} from "./respond.js";

const currentPath = "/admin/messages";

export function messagesRouter(messageService: MessageService): Router {
    const router = Router();

    router.get("/messages", async (req, res) => {
        const page = {user: getAuth(req), currentPath};
        const result = await messageService.list(parsePagination(req));
        if (!result.ok) return sendLoadError(res, page, result.ctx, "Messages");
        send(res, MessagesListView({...page, messages: result.data}));
    });

    router.post("/messages/:id/toggle-read", async (req, res) => {
        const result = await messageService.toggleRead(req.params.id);
        if (!result.ok) {
            return sendActionError(res, {user: getAuth(req), currentPath}, result.ctx, "Message", "update message");
        }
        res.redirect(302, currentPath);
    });

    router.post("/messages/:id/delete", async (req, res) => {
        const result = await messageService.delete(req.params.id);
        if (!result.ok) {
            return sendActionError(res, {user: getAuth(req), currentPath}, result.ctx, "Message", "delete message");
        }
        res.redirect(302, currentPath);
    });

    return router;
}
