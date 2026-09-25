import {v2 as cloudinary, type UploadApiResponse} from "cloudinary";
import {success, emptySuccess, failure, type EmptyResult, type AsyncResult} from "../lib/result.js";
import type {NodeEnv} from "../lib/types.js";
import type LoggerService from "./logger-service.js";
import type {ImageFile, ImageStore, UploadedImage} from "./image-store.js";

class CloudinaryService implements ImageStore {
    constructor(
        cloudinaryName: string,
        cloudinaryKey: string,
        cloudinarySecret: string,
        private readonly mode: NodeEnv,
        private readonly log: LoggerService
    ) {
        cloudinary.config({
            cloud_name: cloudinaryName,
            api_key: cloudinaryKey,
            api_secret: cloudinarySecret,
        });
    }

    async upload(file: ImageFile): AsyncResult<UploadedImage> {
        let result: UploadApiResponse;
        try {
            const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
            result = await cloudinary.uploader.upload(dataUri, {folder: `lindeneg.org/${this.mode}`});
        } catch (err) {
            this.log.warn(err, "cloudinary-service.upload");
            return failure("failed to upload image to cloudinary");
        }
        return success({url: result.secure_url, publicId: result.public_id});
    }

    async delete(publicId: string): Promise<EmptyResult> {
        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (err) {
            this.log.warn(err, "cloudinary-service.delete");
            return failure("failed to delete image from cloudinary");
        }
        return emptySuccess();
    }
}

export default CloudinaryService;
