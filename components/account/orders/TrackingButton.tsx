
import { Button } from "@/components/ui/button";
import { getTrackingUrl } from "@/lib/tracking";
import { ExternalLink, PackageSearch } from "lucide-react";

interface TrackingButtonProps {
    awb: string | null;
    courier: string | null;
    className?: string;
}

export function TrackingButton({ awb, courier, className }: TrackingButtonProps) {
    const isTrackable = !!awb && !!courier;
    const trackingUrl = getTrackingUrl(awb, courier);

    return (
        <Button
            className={className}
            disabled={!isTrackable}
            variant={isTrackable ? "default" : "outline"}
            onClick={() => isTrackable && window.open(trackingUrl, '_blank')}
        >
            <PackageSearch className="w-4 h-4 mr-2" />
            {isTrackable ? "Track Order" : "Tracking Unavailable"}
            {isTrackable && <ExternalLink className="w-3 h-3 ml-2 opacity-70" />}
        </Button>
    );
}
