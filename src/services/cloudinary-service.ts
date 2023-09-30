import { injectService, SingletonService, type IConfigurationService, type ILoggerService } from '@lindeneg/funkallero';
import { v2 as cloudinary } from 'cloudinary';
import SERVICE from '@/enums/service';
import type { IImageService } from '@/interfaces';


class CloudinaryService extends SingletonService implements IImageService {
    @injectService(SERVICE.CONFIGURATION)
    private readonly config: IConfigurationService;

    @injectService(SERVICE.LOGGER)
    private readonly logger: ILoggerService;

    private folderName: string = 'lindeneg.org';

    public async initialize() {
        cloudinary.config({
            cloud_name: this.config.meta.cloudinary.cloudName,
            api_key: this.config.meta.cloudinary.apiKey,
            api_secret: this.config.meta.cloudinary.apiSecret,
        });

        if (this.config.meta.mode) {
            this.folderName += '/' + this.config.meta.mode;
        }
    }

    public async uploadImage(image: string) {
        try {
            const result = await cloudinary.uploader.upload(image, { folder: this.folderName });
            return {
                id: result.public_id,
                url: result.secure_url,
            };
        } catch (err) {
            this.logger.error({
                msg: 'Failed to upload image to cloudinary',
                err,
            });
        }
        return null;
    }

    public async removeImage(id: string) {
        try {
            const result = await cloudinary.uploader.destroy(id);
            return {
                id: result.public_id,
            };
        } catch (err) {
            this.logger.error({
                msg: 'Failed to remove image from cloudinary',
                err,
            });
        }
        return null;
    }

    public async getAllAssets() {
        try {
            const result = await cloudinary.api.resources({ type: 'upload', prefix: this.folderName });
            const data = result.resources.map((e: any) => ({ id: e.id, url: e.url }));
            return {
                data,
            };
        } catch (err) {
            this.logger.error({
                msg: 'Failed to fetch all assets from cloudinary',
                err,
            });
        }
        return { data: [] };
    }
}

export default CloudinaryService;
