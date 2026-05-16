import type {Post} from "@prisma/client";
import {esc} from "../../lib.js";
import {EditorShell} from "../layout.js";
import {TopError} from "../components.js";

export type PostFormValues = {
    title?: string;
    content?: string;
    published?: boolean;
};

export type PostFormViewProps = {
    mode: "create" | "edit";
    post?: Post;
    values?: PostFormValues;
    errors?: Record<string, string>;
    topError?: string;
};

export function PostFormView({mode, post, values, errors, topError}: PostFormViewProps): string {
    const v: PostFormValues = values ?? {
        title: post?.title ?? "",
        content: post?.content ?? "",
        published: post?.published ?? false,
    };
    const e = errors ?? {};
    const action = mode === "create" ? "/admin/blog/new" : `/admin/blog/${post!.id}/edit`;
    const thumbExisting = post?.thumbnail ? `<img src="${esc(post.thumbnail)}" alt="" class="thumb-preview" />` : "";
    const titleError = e.title ? `<p class="form-error">${esc(e.title)}</p>` : "";
    const thumbnailError = e.thumbnail ? `<p class="form-error">${esc(e.thumbnail)}</p>` : "";
    const contentError = e.content ? `<div class="form-top-error">${esc(e.content)}</div>` : "";

    const headerBar = `
        <header class="md-editor-bar">
            <a href="/admin/blog" class="back-link">← Blog</a>
            <input
                form="md-form"
                type="text"
                name="title"
                value="${esc(v.title ?? "")}"
                placeholder="Post title"
                class="md-editor-title-input"
                required
            />
            <div class="md-editor-controls">
                <label class="md-editor-publish">
                    <input type="checkbox" name="published" form="md-form" value="1"${v.published ? " checked" : ""} />
                    Published
                </label>
                <button type="submit" form="md-form" class="btn btn-primary">Save</button>
            </div>
        </header>
        ${titleError}
    `;

    const editorBody = `
        ${TopError(topError)}
        ${contentError}
        <form id="md-form" method="post" action="${action}" enctype="multipart/form-data" class="md-editor-form">
            <details class="md-editor-meta">
                <summary>Thumbnail${post?.thumbnail ? " (current set)" : ""}</summary>
                <div class="md-editor-meta-body">
                    ${thumbExisting}
                    <label class="form-label" for="f_thumbnail">Replace thumbnail</label>
                    <input id="f_thumbnail" type="file" name="thumbnail" accept="image/*" class="form-input" />
                    ${thumbnailError}
                    ${post?.thumbnail ? `<label class="form-check"><input type="checkbox" name="removeThumbnail" value="1" /><span>Remove current thumbnail</span></label>` : ""}
                </div>
            </details>
            <div class="md-editor-split">
                <textarea
                    class="md-editor-source"
                    name="content"
                    data-md-source
                    required
                    spellcheck="false"
                    placeholder="Write your post in Markdown..."
                >${esc(v.content ?? "")}</textarea>
                <div class="md-editor-preview markdown" data-md-preview></div>
            </div>
        </form>
    `;

    return EditorShell({
        title: mode === "create" ? "New post" : `Edit: ${post!.title}`,
        headerBar,
        children: editorBody,
    });
}
