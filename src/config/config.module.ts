import { Global, Module } from '@nestjs/common';
import { ConfigModule as ConfigModuleBase } from '@nestjs/config';
import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';
import { EnvironmentVariables } from './config-validation';

@Global()
@Module({
  imports: [
    ConfigModuleBase.forRoot({
      isGlobal: true,
      validate,
    }),
  ],
})
export class ConfigModule {}

function validate(configuration: Record<string, unknown>) {
  const finalConfig = plainToClass(EnvironmentVariables, configuration, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(finalConfig);
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  Envs = finalConfig;
  return finalConfig;
}

export let Envs: EnvironmentVariables;
