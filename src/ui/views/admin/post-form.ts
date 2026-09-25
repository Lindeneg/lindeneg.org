import type {PostWithRelations} from "../../../repositories/post-repository.js";
import {MAX_UPLOAD_BYTES} from "../../../lib/http.js";
import {esc} from "../../lib.js";
import {EditorLayout} from "../../components/layout.js";
import {TopError} from "../../components/form.js";

export type PostFormValues = {
    title?: string;
    slug?: string;
    content?: string;
    published?: boolean;
    tags?: string;
};

export type PostFormViewProps = {
    mode: "create" | "edit";
    post?: PostWithRelations;
    values?: PostFormValues;
    errors?: Record<string, string>;
    topError?: string;
};

// what the form shows for a saved post, or an empty form without one
export function postFormValues(post?: PostWithRelations): PostFormValues {
    return {
        title: post?.title ?? "",
        slug: post?.slug ?? "",
        content: post?.content ?? "",
        published: post?.published ?? false,
        tags: post?.tags.map((tag) => tag.name).join(", ") ?? "",
    };
}

export function PostFormView({mode, post, values, errors, topError}: PostFormViewProps): string {
    const v: PostFormValues = values ?? postFormValues(post);
    const e = errors ?? {};
    const action = mode === "create" ? "/admin/blog/new" : `/admin/blog/${post!.id}/edit`;
    const thumbExisting = post?.thumbnail ? `<img src="${esc(post.thumbnail)}" alt="" class="thumb-preview" />` : "";
    const titleError = e.title ? `<p class="form-error">${esc(e.title)}</p>` : "";
    const thumbnailError = e.thumbnail ? `<p class="form-error">${esc(e.thumbnail)}</p>` : "";
    const slugError = e.slug ? `<p class="form-error">${esc(e.slug)}</p>` : "";
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
            <details class="md-editor-meta"${slugError ? " open" : ""}>
                <summary>Slug${v.slug ? `: /blog/${esc(v.slug)}` : ""}</summary>
                <div class="md-editor-meta-body">
                    <label class="form-label" for="f_slug">Derived from the title when blank; changing it breaks existing links</label>
                    <input id="f_slug" type="text" name="slug" value="${esc(v.slug ?? "")}" class="form-input" />
                    ${slugError}
                </div>
            </details>
            <details class="md-editor-meta"${thumbnailError ? " open" : ""}>
                <summary>Thumbnail${post?.thumbnail ? " (current set)" : ""}</summary>
                <div class="md-editor-meta-body">
                    ${thumbExisting}
                    <label class="form-label" for="f_thumbnail">Replace thumbnail</label>
                    <input id="f_thumbnail" type="file" name="thumbnail" accept="image/*" data-max-bytes="${MAX_UPLOAD_BYTES}" class="form-input" />
                    ${thumbnailError}
                    ${post?.thumbnail ? `<label class="form-check"><input type="checkbox" name="removeThumbnail" value="1" /><span>Remove current thumbnail</span></label>` : ""}
                </div>
            </details>
            <details class="md-editor-meta">
                <summary>Tags${v.tags ? `: ${esc(v.tags)}` : ""}</summary>
                <div class="md-editor-meta-body">
                    <label class="form-label" for="f_tags">Broad topics, comma separated, e.g. music, programming</label>
                    <input id="f_tags" type="text" name="tags" value="${esc(v.tags ?? "")}" class="form-input" />
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

    return EditorLayout({
        title: mode === "create" ? "New post" : `Edit: ${post!.title}`,
        headerBar,
        children: editorBody,
    });
}
