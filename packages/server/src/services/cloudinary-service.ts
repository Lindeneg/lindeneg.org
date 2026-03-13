import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import {
  success,
  emptySuccess,
  failure,
  type Result,
  type EmptyResult,
  type NodeEnv,
} from '@lindeneg/shared';
import type LoggerService from './logger-service.js';

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

class CloudinaryService {
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

  async upload(image: string): Promise<Result<CloudinaryUploadResult>> {
    let result: UploadApiResponse | null = null;
    try {
      const folder = 'lindeneg.org' + (this.mode ? '/' + this.mode : '');
      result = await cloudinary.uploader.upload(image, { folder });
    } catch (err) {
      this.log.warn(err, 'cloudinary-service.upload');
      return failure('failed to upload image to cloudinary');
    }
    return success({ url: result.secure_url, publicId: result.public_id });
  }

  async delete(publicId: string): Promise<EmptyResult> {
    let result: UploadApiResponse | null = null;
    try {
      result = await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      this.log.warn(err, 'cloudinary-service.delete');
      return failure('failed to delete image from cloudinary');
    }
    return emptySuccess();
  }
}

export default CloudinaryService;
