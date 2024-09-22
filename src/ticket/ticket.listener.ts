import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { WebSocket } from 'ws';
import {
  TICKET_CHANNEL,
  TICKET_PUBLISHER_KEY,
  TICKET_SUBSCRIBER_KEY,
} from './common';
import { Ticker } from './model/ticket';

@Injectable()
export class TicketListener implements OnModuleDestroy {
  private logger = new Logger(TicketListener.name);

  private ws: WebSocket | null = null;
  private watchSymbolPairs: Set<string> = new Set();
  private tempUpdates: Record<string, Ticker> = {};

  // ------------------------------------------------------------------

  constructor(
    @Inject(TICKET_PUBLISHER_KEY) private readonly publisher: Redis,
    @Inject(TICKET_SUBSCRIBER_KEY) private readonly subscriber: Redis,
  ) {}

  onModuleInit() {
    this.connect();
  }

  private connect() {
    this.ws = new WebSocket('wss://stream.binance.com:9443/ws');

    this.ws.on('open', this.handleOpen.bind(this));
    this.ws.on('message', this.handleMessage.bind(this));
    this.ws.on('error', this.handleError.bind(this));
    this.ws.on('close', this.handleClose.bind(this));
  }

  private handleOpen() {
    this.logger.log('Initialized');
    this.watchSymbolPairs.forEach((symbol) => this.subscribeToSymbol(symbol));
  }

  // ------------------------------------------------------------------

  private handleMessage(data: WebSocket.RawData) {
    const message = JSON.parse(data.toString());

    if (!message.s) return;

    const record = Ticker.serialize(message);

    this.tempUpdates[record.symbol] = record;

    if (Object.keys(this.tempUpdates).length) {
      this.publisher.publish(TICKET_CHANNEL, JSON.stringify(this.tempUpdates));
    }
  }

  private handleError(err: Error) {
    console.error('WebSocket error', err);
  }

  private handleClose() {
    this.logger.warn('WebSocket closed, reconnecting...');
    setTimeout(() => this.connect(), 1000);
  }

  // ------------------------------------------------------------------

  public subscribe(symbols: string[]) {
    let someAdded = false;
    for (let symbol of symbols) {
      if (!this.watchSymbolPairs.has(symbol)) {
        this.watchSymbolPairs.add(symbol);
        this.subscribeToSymbol(symbol);
        this.logger.log(`SUBSCRIBE: ${symbol}`);
        someAdded = true;
      }
    }
    return someAdded;
  }

  public unsubscribe(symbols: string[]) {
    let someDeleted = false;
    for (let symbol of symbols) {
      if (this.watchSymbolPairs.has(symbol)) {
        this.watchSymbolPairs.delete(symbol);
        this.unsubscribeToSymbol(symbol);
        this.logger.log(`UNSUBSCRIBE: ${symbol}`);
        someDeleted = true;
      }
    }
    return someDeleted;
  }

  private subscribeToSymbol(symbol: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          method: 'SUBSCRIBE',
          params: [`${symbol.toLowerCase()}@ticker`],
          id: Date.now(),
        }),
      );
    }
  }

  private unsubscribeToSymbol(symbol: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          method: 'SUBSCRIBE',
          params: [`${symbol.toLowerCase()}@ticker`],
          id: Date.now(),
        }),
      );
    }
  }


  // ------------------------------------------------------------------
  onModuleDestroy() {
    this.logger.warn('Module destroy');
    this.watchSymbolPairs.forEach((symbol) => this.unsubscribeToSymbol(symbol));
    this.ws?.close();
  }
}
