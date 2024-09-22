import { Ticker } from '../model/ticket';

export type HandlerType = {
  handler: (target: any, filteredItems: Record<string, Ticker>) => void;
  symbols: string[];
  target: any;
};

export interface PriceRecord {
  time: number;
  price: number;
}

export interface PriceChangeData {
  start: number;
  end: number;
  change: number;
}

export type TicketListenerOptions = {
  intervals: number[];
};
