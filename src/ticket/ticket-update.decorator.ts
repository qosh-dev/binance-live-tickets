import 'reflect-metadata';
import { TICKET_DISCOVERY_HANDLERS_KEY } from './common';
import { wait } from './helpers';
import { TicketModule } from './ticket.module';
import { HandlerType } from './type/types';


export function TicketUpdate(symbols: `${string}${string}`[] = []): MethodDecorator {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    registerHandler({
      symbols,
      handler: descriptor.value,
      target
    });
    return descriptor;
  };
}

async function registerHandler(item: HandlerType) {
  try {
    const existHandlers: HandlerType[] = Reflect.getMetadata(
      TICKET_DISCOVERY_HANDLERS_KEY,
      TicketModule,
    );
    if (!existHandlers) {
      await wait(1000);
      return registerHandler(item);
    }

    existHandlers.push(item);
    Reflect.defineMetadata(
      TICKET_DISCOVERY_HANDLERS_KEY,
      existHandlers,
      TicketModule,
    );
  } catch {
    await wait(1000);
    return registerHandler(item);
  }
}