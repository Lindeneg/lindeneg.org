import type {AsyncResult} from "../lib/result.js";

export interface ImageFile {
    buffer: Buffer;
    mimetype: string;
}

export interface UploadedImage {
    url: string;
    publicId: string;
}

export interface ImageStore {
    upload(file: ImageFile): AsyncResult<UploadedImage>;
    delete(publicId: string): AsyncResult<void>;
}
