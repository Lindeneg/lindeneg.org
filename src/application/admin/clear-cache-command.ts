import { MediatorResultSuccess, injectService } from '@lindeneg/funkallero';
import BaseAction from '../base-action';
import SERVICE from '@/enums/service';
import type CachingService from '@/services/caching-service';

export class ClearCacheCommand extends BaseAction {
    @injectService(SERVICE.CACHING)
    protected readonly cachingService: CachingService;

    public async execute() {
        this.cachingService.clearCache();
        return new MediatorResultSuccess('cache cleared');
    }
}
