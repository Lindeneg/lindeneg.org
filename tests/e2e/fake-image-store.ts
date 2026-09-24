import {success, emptySuccess, type AsyncResult, type EmptyResult} from "../../src/lib/result.js";
import type {ImageFile, ImageStore, UploadedImage} from "../../src/services/image-store.js";

class FakeImageStore implements ImageStore {
    #next = 1;

    async upload(_file: ImageFile): AsyncResult<UploadedImage> {
        const publicId = `fake-${this.#next++}`;
        return success({url: `https://images.test/${publicId}`, publicId});
    }

    async delete(_publicId: string): Promise<EmptyResult> {
        return emptySuccess();
    }
}

export default FakeImageStore;
