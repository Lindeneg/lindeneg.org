import { ACTION_RESULT, MediatorResultSuccess, MediatorResultFailure, injectService } from '@lindeneg/funkallero';
import BaseAction from '../base-action';
import SERVICE from '@/enums/service';
import type CloudinaryService from '@/services/cloudinary-service';

export class GetUserPhotoQuery extends BaseAction {
    public async execute({ userId }: Record<'userId', string>) {
        const user = await this.dataContext.exec((p) =>
            p.user.findUnique({ where: { id: userId }, select: { photo: true } })
        );

        if (!user || !user.photo) {
            return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);
        }

        return new MediatorResultSuccess(user.photo);
    }
}

export class AddUserPhotoCommand extends BaseAction {
    @injectService(SERVICE.CLOUDINARY)
    private readonly cloudinaryService: CloudinaryService;

    public async execute({ userId, image }: Record<'userId' | 'image', string>) {
        const user = await this.dataContext.exec((p) => p.user.findUnique({ where: { id: userId } }));

        if (!user) {
            return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);
        }

        if (!image) {
            return new MediatorResultFailure(ACTION_RESULT.ERROR_BAD_PAYLOAD);
        }

        const uploadResult = await this.cloudinaryService.uploadImage(image);
        const photoUrl = uploadResult ? uploadResult.secure_url : '';
        const photoId = uploadResult ? uploadResult.public_id : '';

        if (!photoUrl || !photoId) {
            return new MediatorResultFailure(ACTION_RESULT.ERROR_UNPROCESSABLE);
        }

        if (user.photoId) {
            await this.cloudinaryService.removeImage(user.photoId);
        }

        const updatedUser = await this.dataContext.exec((p) =>
            p.user.update({
                where: { id: userId },
                data: { photo: photoUrl, photoId },
            })
        );

        if (!updatedUser) {
            return new MediatorResultFailure(ACTION_RESULT.ERROR_INTERNAL_ERROR);
        }

        return new MediatorResultSuccess(ACTION_RESULT.UNIT);
    }
}

export class DeleteUserPhotoCommand extends BaseAction {
    @injectService(SERVICE.CLOUDINARY)
    private readonly cloudinaryService: CloudinaryService;

    public async execute({ userId }: Record<'userId', string>) {
        const user = await this.dataContext.exec((p) => p.user.findUnique({ where: { id: userId } }));

        if (!user || !user.photoId) {
            return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);
        }

        const deleteResult = await this.cloudinaryService.removeImage(user.photoId);

        if (!deleteResult) {
            return new MediatorResultFailure(ACTION_RESULT.ERROR_UNPROCESSABLE);
        }

        const updatedUser = await this.dataContext.exec((p) =>
            p.user.update({
                where: { id: userId },
                data: { photo: null, photoId: null },
            })
        );

        if (!updatedUser) {
            return new MediatorResultFailure(ACTION_RESULT.ERROR_INTERNAL_ERROR);
        }

        return new MediatorResultSuccess(ACTION_RESULT.UNIT);
    }
}
