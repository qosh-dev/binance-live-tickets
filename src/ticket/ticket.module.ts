import { DynamicModule, Inject, Module } from '@nestjs/common';
import { PARAMTYPES_METADATA } from '@nestjs/common/constants';
import { DiscoveryModule, DiscoveryService } from '@nestjs/core';
import Redis, { RedisOptions } from 'ioredis';
import {
  TICKET_CHANNEL,
  TICKET_DISCOVERY_HANDLERS_KEY,
  TICKET_PERCENTAGE_OPTIONS,
  TICKET_PUBLISHER_KEY,
  TICKET_SUBSCRIBER_KEY,
} from './common';
import { wait } from './helpers';
import { Ticker } from './model/ticket';
import { TicketTransformer } from './model/transformer';
import { TicketListener } from './ticket.listener';
import { TicketService } from './ticket.service';
import { HandlerType, TicketListenerOptions } from './type/types';

@Module({
  imports: [DiscoveryModule],
  providers: [TicketListener, TicketService],
  exports: [TicketService],
})
export class TicketModule {
  static forRoot(options: {
    redis: RedisOptions;
    options: TicketListenerOptions;
  }): DynamicModule {
    const publisher = {
      provide: TICKET_PUBLISHER_KEY,
      useFactory: () => new Redis(options.redis),
    };

    const subscriber = {
      provide: TICKET_SUBSCRIBER_KEY,
      useFactory: () => new Redis(options.redis),
    };
    Reflect.defineMetadata(
      TICKET_PERCENTAGE_OPTIONS,
      options.options,
      TicketTransformer,
    );

    return {
      module: TicketModule,
      providers: [publisher, subscriber],
    };
  }

  // ---------------------------------------------------------------------------

  constructor(
    readonly discovery: DiscoveryService,
    @Inject(TICKET_PUBLISHER_KEY) readonly publisher: Redis,
    @Inject(TICKET_SUBSCRIBER_KEY) readonly subscriber: Redis,
    readonly service: TicketService,
    readonly listener: TicketListener,
  ) {
    Reflect.defineMetadata(TICKET_DISCOVERY_HANDLERS_KEY, [], TicketModule);
  }

  private async onModuleInit() {
    await wait(3000);
    const handlers: HandlerType[] = Reflect.getMetadata(
      TICKET_DISCOVERY_HANDLERS_KEY,
      TicketModule,
    );

    const allSymbols = handlers.map((h) => h.symbols).flat();

    this.publish(allSymbols);

    this.subscribe((items) => {
      handlers.forEach((handler) => {
        const filteredItems = this.filterItemsBySymbols(items, handler.symbols);
        this.assignInjectables(handler);
        handler.handler.apply(handler.target, [filteredItems]);
      });
    });
  }

  // --------------------------------------------------------------------------------

  subscribe(callback: (filteredItems: Record<string, Ticker>) => void) {
    this.subscriber.subscribe(TICKET_CHANNEL);

    this.subscriber.on('message', (messageChannel: string, message: string) => {
      if (messageChannel !== TICKET_CHANNEL) return;

      const items: Record<`${string}${string}`, Ticker> = JSON.parse(message);
      callback(items);
    });
  }

  publish(symbols: string[]) {
    this.listener.subscribe(symbols);
  }

  // --------------------------------------------------------------------------------

  private assignInjectables(handler: HandlerType) {
    const providers = this.discovery.getProviders();
    const paramTypes =
      Reflect.getMetadata(PARAMTYPES_METADATA, handler.target) || [];
    const paramNames = this.getParameterNames(handler.target);

    paramNames.forEach((paramName, index) => {
      const typeName = paramTypes[index]?.name;
      const provider = providers.find((p) => p.name === typeName);
      if (provider) {
        handler.target[paramName] = provider.instance;
      }
    });
  }

  private filterItemsBySymbols(
    items: Record<string, Ticker>,
    symbols: string[],
  ): Record<string, Ticker> {
    return symbols.length
      ? Object.fromEntries(
          Object.entries(items).filter(([key]) => symbols.includes(key)),
        )
      : items;
  }

  private getParameterNames(func: Function): string[] {
    const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;
    const ARGUMENT_NAMES = /([^\s,]+)/g;

    const fnStr = func.toString().replace(STRIP_COMMENTS, '');
    const result = fnStr
      .slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')'))
      .match(ARGUMENT_NAMES);
    return result || [];
  }
}
