import { useState } from "react";
import { Button } from "../assistant/ai-chat/button";
import FileOrganizer from "../..";

export function TopUpCredits({
  plugin,
  onLicenseKeyChange,
}: {
  plugin: FileOrganizer;
  onLicenseKeyChange: (licenseKey: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleTopUp = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${plugin.getServerUrl()}/api/top-up`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${plugin.settings.API_KEY}`,
        },
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
      onLicenseKeyChange(data.licenseKey);
    } catch (error) {
      console.error("Top-up error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleTopUp} disabled={loading} className="w-full">
      {loading
        ? "Processing..."
        : "Top Up $15 worth of credits"}
    </Button>
  );
}
