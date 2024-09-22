import { TICKET_PERCENTAGE_OPTIONS } from '../common';
import {
  PriceChangeData,
  PriceRecord,
  TicketListenerOptions,
} from '../type/types';
import { Ticker } from './ticket';

let singleton: TicketTransformer | null = null;

export class TicketTransformer {
  private priceHistoryMap: Map<string, PriceRecord[]> = new Map();

  private options: TicketListenerOptions;

  static get instance() {
    if (!singleton) {
      singleton = new TicketTransformer();
    }
    return singleton;
  }

  private constructor() {
    this.options = Reflect.getMetadata(
      TICKET_PERCENTAGE_OPTIONS,
      TicketTransformer,
    );
  }

  private calculatePercentageChange(
    oldPrice: number,
    newPrice: number,
  ): number {
    return this.fixNum(((newPrice - oldPrice) / oldPrice) * 100, 3);
  }

  private fixNum(num: number, digits: number): number {
    return parseFloat(num.toFixed(digits));
  }

  private getOrCreatePriceHistory(pair: string): PriceRecord[] {
    if (!this.priceHistoryMap.has(pair)) {
      this.priceHistoryMap.set(pair, []);
    }
    return this.priceHistoryMap.get(pair)!;
  }

  transform(tickerData: Ticker) {
    const currentTime = Date.now();
    const pair = tickerData.symbol;
    const priceHistory = this.getOrCreatePriceHistory(pair);

    priceHistory.push({
      time: currentTime,
      price: tickerData.currentPrice,
    });

    while (
      priceHistory.length > 0 &&
      currentTime - priceHistory[0].time > this.options.intervals.at(-1)! * 2000
    ) {
      priceHistory.shift();
    }

    const changePercentage: { [interval: number]: PriceChangeData | null } = {};

    this.options.intervals.forEach((interval) => {
      const targetTime = currentTime - interval * 1000;

      const index = this.findClosestIndex(priceHistory, targetTime);
      const priceRecord = index !== -1 ? priceHistory[index] : null;

      if (priceRecord) {
        const percentageChange = this.calculatePercentageChange(
          priceRecord.price,
          tickerData.currentPrice,
        );
        changePercentage[interval] = {
          start: priceRecord.price,
          end: tickerData.currentPrice,
          change: percentageChange,
        };
      } else {
        changePercentage[interval] = {
          start: 0,
          end: 0,
          change: 0,
        };
      }
    });

    tickerData.changePercentage = changePercentage;
    return tickerData;
  }

  private findClosestIndex(
    priceHistory: PriceRecord[],
    targetTime: number,
  ): number {
    let left = 0;
    let right = priceHistory.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (priceHistory[mid].time === targetTime) {
        return mid;
      } else if (priceHistory[mid].time < targetTime) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    return right >= 0 && priceHistory[right].time <= targetTime ? right : -1;
  }
}
