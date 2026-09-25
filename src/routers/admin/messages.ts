import {Router} from "express";
import {send} from "../../lib/http.js";
import {parsePagination} from "../../lib/pagination.js";
import {getAuth} from "../../middleware/admin-auth.js";
import {MessageError} from "../../services/message-service.js";
import type MessageService from "../../services/message-service.js";
import type TemplateService from "../../services/template-service.js";

const currentPath = "/admin/messages";

export function messagesRouter(messageService: MessageService, templates: TemplateService): Router {
    const router = Router();

    router.get("/messages", async (req, res) => {
        const user = getAuth(req);
        const result = await messageService.list(parsePagination(req));
        if (!result.ok) {
            return send(res, templates.admin.error({user, currentPath, message: "Failed to load messages"}), 500);
        }
        send(res, templates.admin.messagesList({user, currentPath, messages: result.data}));
    });

    router.post("/messages/:id/toggle-read", async (req, res) => {
        const user = getAuth(req);
        const result = await messageService.toggleRead(req.params.id);
        if (!result.ok) {
            const notFound = result.ctx === MessageError.NOT_FOUND;
            return send(
                res,
                templates.admin.error({
                    user,
                    currentPath,
                    message: notFound ? "Message not found" : "Failed to update message",
                }),
                notFound ? 404 : 500
            );
        }
        res.redirect(302, currentPath);
    });

    router.post("/messages/:id/delete", async (req, res) => {
        const user = getAuth(req);
        const result = await messageService.delete(req.params.id);
        if (!result.ok) {
            return send(res, templates.admin.error({user, currentPath, message: "Failed to delete message"}), 500);
        }
        res.redirect(302, currentPath);
    });

    return router;
}
