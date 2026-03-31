import DashboardPageLayout from "@/components/dashboard/layout";
import Watchlist from "@/components/investment/watchlist";
import BracketsIcon from "@/components/icons/brackets";
import { EyeIcon } from "lucide-react";

export default function WatchlistPage() {
    return (
        <DashboardPageLayout
            header={{
                title: "Watchlist",
                description: "Track your favorite stocks, indices, and assets",
                icon: EyeIcon,
            }}
        >
            <div className="space-y-6">
                <Watchlist />
            </div>
        </DashboardPageLayout>
    );
}
