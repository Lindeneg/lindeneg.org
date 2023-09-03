import { injectService, SingletonService, type IConfigurationService } from '@lindeneg/funkallero';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import SERVICE from '@/enums/service';

class CloudinaryService extends SingletonService {
    @injectService(SERVICE.CONFIGURATION)
    private readonly config: IConfigurationService;

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
            console.log(err);
        }
        return result;
    }
}

export default CloudinaryService;
