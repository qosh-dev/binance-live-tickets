# TicketModule for NestJS

## Overview

TicketModule is a NestJS module designed to listen for Binance pair ticker updates, calculate percentage changes over specified intervals, and facilitate real-time data processing through Redis-based pub/sub communication. The module offers flexibility in setting up different intervals for percentage change calculations and allows for easy integration using custom decorators.

## Features

<ul>
  <li>
    Real-time Binance Ticker Updates: Listens to Binance pair tickers and processes the data in real-time.
  </li>
  <li>
    Percentage Change Calculation: Calculates the percentage change of prices over configurable intervals (e.g., 2, 4, 5, 6, 10, 30, 60 seconds).
  </li>
  <li>
    Redis Pub/Sub Communication: Utilizes Redis for communication between publishers and subscribers, ensuring efficient data handling.
  </li>
  <li>
    Custom Decorator for Ticker Updates: Simplifies the process of registering methods to handle ticker updates with the @TicketUpdate decorator.
  </li>
  <li>
    Dynamic Module Configuration: Allows for easy customization and initialization with different Redis options and percentage change configurations.
  </li>
</ul>

## Installation

<ol>
  <li>
    <b>Clone the repository</b> and navigate to the project directory.

      git clone <repository-url>
      cd <repository-directory>

  </li>

  <li>
    <b>Install dependencies</b> using npm or yarn.

      npm install

  </li>

  <li>
    <b>Set up the environment variables</b> by creating a .env file in the project root with the following content:

      REDIS_VERSION="latest"
      REDIS_HOST="localhost"
      REDIS_PORT=6379
      REDIS_PASSWORD="qweQWE123!"

  </li>

  <li>
    <b>Run Redis using Docker</b> with the provided docker-compose.yaml.

      docker-compose up -d

  </li>
</ol>


# Usage

## Module Initialization

To use the TicketModule in your application, import it and initialize it in your root module with the desired configuration:

import { Module } from '@nestjs/common';
import { TicketModule } from './ticket.module';

    @Module({
      imports: [
        TicketModule.forRoot({
          redis: {
            host: Envs.REDIS_HOST,
            port: Envs.REDIS_PORT,
            password: Envs.REDIS_PASSWORD,
          },
          percentageChange: {
            intervals: [2, 4, 5, 6, 10, 30, 60],
          },
        }),
      ],
    })
    export class AppModule {}

## Listening for Ticker Updates

You can create a service or controller and use the @TicketUpdate decorator to register methods that will handle ticker updates, if not specify any symbols to first arg decorator will listen to all registered symbols:

    import { Injectable } from '@nestjs/common';
    import { TicketUpdate } from './ticket.module';
    import { Ticker } from './model/ticket';

    @Injectable()
    export class SomeService {
      @TicketUpdate(['BTCUSDT', 'ETHUSDT']) // listen BTCUSDT, ETHUSDT
      onTicketUpdate(items: Record<string, Ticker>) {
        for (let symbol in items) {
          console.log(item);
        }
      }

      @TicketUpdate(['PEPEUSDT']) // listen PEPEUSDT
      onTicketUpdate(items: Record<string, Ticker>) {
        for (let symbol in items) {
          console.log(item);
        }
      }

      @TicketUpdate() // listen PEPEUSDT, BTCUSDT, ETHUSDT
      onTicketUpdate(items: Record<string, Ticker>) {
        for (let symbol in items) {
          console.log(item);
        }
      }

    }

## Subscription and Unsubscription

You can programmatically subscribe or unsubscribe to specific symbols:

    import { Injectable } from '@nestjs/common';
    import { TicketService } from './ticket.module';

    @Injectable()
    export class SomeService {
      constructor(private readonly ticketService: TicketService) {}

      subscribeToSymbols() {
        this.ticketService.subscribe(['BTCUSDT', 'ETHUSDT']);
      }

      unsubscribeFromSymbols() {
        this.ticketService.unSubscribe(['BTCUSDT', 'ETHUSDT']);
      }
    }

## Environment Variables

Ensure that the following environment variables are set in your .env file:

<ul>
  <li><code>REDIS_VERSION</code> - Version of the Redis image to use in Docker.</li>
  <li><code>REDIS_HOST</code> - Hostname of the Redis server.</li>
  <li><code>REDIS_PORT</code> - Port number for Redis.</li>
  <li><code>REDIS_PASSWORD</code> - Password for Redis authentication.</li>
</ul>

## Docker Configuration

The module comes with a Docker Compose configuration to easily set up Redis. The docker-compose.yaml file contains the necessary configuration:

    version: '3.9'
    name: 'app'
    services:
      redis:
        image: redis:7.0.8-alpine
        restart: always
        command: /bin/sh -c "redis-server --requirepass $REDIS_PASSWORD --port $REDIS_PORT"
        ports:
          - $REDIS_PORT:6379
        environment:
          REDIS_HOSTS: redis:$REDIS_HOST:$REDIS_PORT
          REDIS_DATABASES: 3
          REDIS_PASSWORD: $REDIS_PASSWORD
        networks:
          - networks
        volumes:
          - ./volumes/redis:/data

    networks:
      volumes:
        driver: bridge

## Contributing
Feel free to submit issues and feature requests. Contributions are welcome via pull requests.

## License
This project is licensed under the MIT License.

## Contact
For further questions or support, please contact 501123445a@gmail.com.

---

<p align="center">
  <span style="display: inline-block; vertical-align: middle;">Build with NestJs</span>
  <img src="https://nestjs.com/img/logo-small.svg" alt="NestJS Logo" width="30" style="display: inline-block; vertical-align: middle;">
</p>
