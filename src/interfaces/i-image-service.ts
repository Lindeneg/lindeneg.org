interface IImageServiceUploadResult {
    id: string;
    url: string;
}

interface IImageServiceDeleteResult {
    id: string;
}

interface IImageServiceGetAllResult {
    data: IImageServiceUploadResult[];
}


export interface IImageService {
    uploadImage(image: string): Promise<IImageServiceUploadResult | null>;

    removeImage(id: string): Promise<IImageServiceDeleteResult | null>;

    getAllAssets(): Promise<IImageServiceGetAllResult>;
}