'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { UserProfile } from "@/lib/brokers/types";

interface BrokerConnectProps {
  connectedAccount?: UserProfile | null;
  brokerName?: string;
}

export default function BrokerConnect({ connectedAccount, brokerName = 'upstox' }: BrokerConnectProps) {
  const router = useRouter();

  const handleConnect = (broker: string) => {
    window.location.href = `/api/brokers/${broker}/login`;
  };

  const handleDisconnect = async (broker: string) => {
    try {
      await fetch(`/api/brokers/${broker}/logout`, { method: 'POST' });
      router.refresh();
      // Force reload to ensure server-side props update immediately if router.refresh() is lazy
      window.location.reload(); 
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  if (connectedAccount) {
    return (
      <div className="flex items-center justify-between p-4 border rounded-lg bg-green-500/10 border-green-500/20">
        <div className="flex flex-col">
          <h3 className="font-semibold text-green-700 dark:text-green-400">Connected to {brokerName.charAt(0).toUpperCase() + brokerName.slice(1)}</h3>
          <div className="text-sm text-muted-foreground">
             <span className="font-medium">{connectedAccount.name}</span> <span className="text-xs">({connectedAccount.brokerUserId})</span>
          </div>
        </div>
        <Button 
          onClick={() => handleDisconnect(brokerName)} 
          variant="destructive" 
          size="sm"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-4 p-4 border rounded-lg bg-card/50">
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold">Connect Broker</h3>
        <p className="text-sm text-muted-foreground">Link your brokerage account through:</p>
        <div className="flex gap-2 mt-2">
          <Button onClick={() => handleConnect('upstox')} variant="default">
            Connect Upstox
          </Button>
          <Button onClick={() => handleConnect('zerodha')} variant="outline">
            Connect Zerodha
          </Button>
        </div>
      </div>
    </div>
  );
}
