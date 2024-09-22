import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import {
  TICKET_CHANNEL,
  TICKET_PUBLISHER_KEY,
  TICKET_SUBSCRIBER_KEY,
} from './common';
import { Ticker } from './model/ticket';
import { TicketUpdate } from './ticket-update.decorator';
import { TicketListener } from './ticket.listener';

@Injectable()
export class TicketService {
  constructor(
    @Inject(TICKET_PUBLISHER_KEY)private readonly publisher: Redis,
    @Inject(TICKET_SUBSCRIBER_KEY)private readonly subscriber: Redis,
    readonly listener: TicketListener,
  ) {}

  @TicketUpdate([ 'ARKUSDT'])
  onTicketUpdate(items: Record<`${string}${string}`, Ticker>) {
    for (let symbol in items) {
      console.log({
        symbol,
        item: items[symbol].changePercentage,
      });
    }
  }

  // --------------------------------------------------------------------

  listenForTicketUpdates(
    symbols: string[],
    callback: (filteredItems: Record<string, Ticker>) => void,
  ) {
    this.subscriber.subscribe(TICKET_CHANNEL);

    this.subscriber.on('message', (messageChannel: string, message: string) => {
      if (messageChannel !== TICKET_CHANNEL) return;

      const items: Record<`${string}${string}`, Ticker> = JSON.parse(message);

      const filteredItems = symbols.length
        ? Object.fromEntries(
            Object.entries(items).filter(([key]) => symbols.includes(key)),
          )
        : items;

      callback(filteredItems);
    });
  }

  subscribe(symbols: `${string}${string}`[]) {
    this.listener.subscribe(symbols);
  }

  unSubscribe(symbols: `${string}${string}`[]) {
    this.listener.unsubscribe(symbols);
  }
}
