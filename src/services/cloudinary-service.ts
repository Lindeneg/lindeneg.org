import { injectService, SingletonService, type IConfigurationService, type ILoggerService } from '@lindeneg/funkallero';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import SERVICE from '@/enums/service';

class CloudinaryService extends SingletonService {
    @injectService(SERVICE.CONFIGURATION)
    private readonly config: IConfigurationService;

    @injectService(SERVICE.LOGGER)
    private readonly logger: ILoggerService;

    public async initialize() {
        cloudinary.config({
            cloud_name: this.config.meta.cloudinary.cloudName,
            api_key: this.config.meta.cloudinary.apiKey,
            api_secret: this.config.meta.cloudinary.apiSecret,
        });
    }

    public async uploadImage(image: string) {
        let result: UploadApiResponse | null = null;
        try {
            result = await cloudinary.uploader.upload(image);
        } catch (err) {
            this.logger.error({
                msg: 'Failed to upload image to cloudinary',
                err,
            });
        }
        return result;
    }

    public async removeImage(id: string) {
        let result: UploadApiResponse | null = null;
        try {
            result = await cloudinary.uploader.destroy(id);
        } catch (err) {
            this.logger.error({
                msg: 'Failed to remove image from cloudinary',
                err,
            });
        }
        return result;
    }
}

export default CloudinaryService;
