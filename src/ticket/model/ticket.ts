import { TicketTransformer } from './transformer';

export class Ticker {
  eventType: string; // Тип события
  eventTime: number; // Время события
  symbol: `${string}${string}`; // Символ торговой пары
  priceChange: number; // Изменение цены
  priceChangePercent: number; // Процент изменения цены
  weightedAvgPrice: number; // Средневзвешенная цена
  prevClosePrice: number; // Цена закрытия предыдущего дня
  currentPrice: number; // Текущая цена
  currentQuantity: number; // Текущий объем
  bestBidPrice: number; // Лучшая цена покупки
  bestBidQuantity: number; // Лучшая цена покупки (объем)
  bestAskPrice: number; // Лучшая цена продажи
  bestAskQuantity: number; // Лучшая цена продажи (объем)
  openPrice: number; // Цена открытия
  highPrice: number; // Максимальная цена за последние 24 часа
  lowPrice: number; // Минимальная цена за последние 24 часа
  volume: number; // Объем торгов
  quoteVolume: number; // Объем торгов в валюте котировки
  openTime: number; // Время открытия
  closeTime: number; // Время закрытия
  firstTradeId: number; // ID первой сделки
  lastTradeId: number; // ID последней сделки
  tradeCount: number; // Количество сделок
  changePercentage: any; // Record<number, number>;

  constructor(data: any) {
    this.eventType = data.e;
    this.eventTime = Number(data.E);
    this.symbol = data.s;
    this.priceChange = Number(data.p);
    this.priceChangePercent = Number(data.P);
    this.weightedAvgPrice = Number(data.w);
    this.prevClosePrice = Number(data.x);
    this.currentPrice = Number(data.c);
    this.currentQuantity = Number(data.Q);
    this.bestBidPrice = Number(data.b);
    this.bestBidQuantity = Number(data.B);
    this.bestAskPrice = Number(data.a);
    this.bestAskQuantity = Number(data.A);
    this.openPrice = Number(data.o);
    this.highPrice = Number(data.h);
    this.lowPrice = Number(data.l);
    this.volume = Number(data.v);
    this.quoteVolume = Number(data.q);
    this.openTime = Number(data.O);
    this.closeTime = Number(data.C);
    this.firstTradeId = Number(data.F);
    this.lastTradeId = Number(data.L);
    this.tradeCount = Number(data.n);
  }

  static serialize(data: any): Ticker {
    const record = new Ticker(data);
    return TicketTransformer.instance.transform(record);
  }
}
