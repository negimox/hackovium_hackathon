import { IBrokerProvider } from './types';
import { UpstoxProvider } from './upstox/provider';
import { ZerodhaProvider } from './zerodha/provider';

const providers: Record<string, IBrokerProvider> = {
  'UPSTOX': new UpstoxProvider(),
  'ZERODHA': new ZerodhaProvider(),
};

export function getBrokerProvider(brokerName: string): IBrokerProvider | undefined {
  return providers[brokerName.toUpperCase()];
}

export function getAllBrokers(): IBrokerProvider[] {
  return Object.values(providers);
}

export * from './types';
export * from './encryption';
