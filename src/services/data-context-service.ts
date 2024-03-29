import { PrismaClient } from "@prisma/client";
import {
  injectService,
  SingletonService,
  type ILoggerService,
  type IDataContextService,
} from "@lindeneg/funkallero";
import SERVICE from "@/enums/service";

type PrismaCallback<TReturn = any> = (prisma: PrismaClient) => Promise<TReturn>;

type ActionReturn<TAction extends PrismaCallback> = Awaited<
  ReturnType<TAction>
>;

class DataContextService
  extends SingletonService
  implements IDataContextService
{
  @injectService(SERVICE.LOGGER)
  private readonly logger: ILoggerService;

  public readonly client: PrismaClient;

  constructor() {
    super();
    this.client = new PrismaClient();
  }

  public async exec<TAction extends PrismaCallback>(
    callback: TAction
  ): Promise<ActionReturn<TAction> | null> {
    try {
      await this.client.$connect();

      const val = await callback(this.client);

      await this.client.$disconnect();

      return val;
    } catch (err) {
      this.logger.error({
        msg: "prisma action failed, disconnecting...",
        err,
      });

      await this.client.$disconnect();

      return null;
    }
  }
}

export default DataContextService;
