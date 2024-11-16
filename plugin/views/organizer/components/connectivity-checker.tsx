import * as React from "react";
import { ErrorBox } from "./error-box";
import FileOrganizer from "../../..";

interface ConnectivityCheckerProps {
  onConnectivityValid: () => void;
  plugin: FileOrganizer;
}

export const ConnectivityChecker: React.FC<ConnectivityCheckerProps> = ({
  onConnectivityValid,
  plugin,
}) => {
  const [isChecking, setIsChecking] = React.useState(true);
  const [connectivityError, setConnectivityError] = React.useState<string | null>(null);

  const checkConnectivity = React.useCallback(async () => {
    try {
      setIsChecking(true);
      setConnectivityError(null);

      // First check if we have internet connectivity
      const hasInternet = await fetch('https://1.1.1.1/cdn-cgi/trace', { 
        mode: 'no-cors',
        cache: 'no-store'
      })
        .then(() => true)
        .catch(() => false);

      if (!hasInternet) {
        setConnectivityError("No internet connection");
        return;
      }

      // Then check if our server is accessible
      const serverResponse = await fetch(`${plugin.getServerUrl()}/api/health`, {
        method: 'GET',
        cache: 'no-store'
      });

      if (!serverResponse.ok) {
        setConnectivityError("Cannot connect to server");
        return;
      }

      onConnectivityValid();
    } catch (err) {
      setConnectivityError("Failed to establish connection");
    } finally {
      setIsChecking(false);
    }
  }, [onConnectivityValid, plugin]);

  React.useEffect(() => {
    checkConnectivity();
  }, [checkConnectivity]);

  if (connectivityError) {
    return (
      <ErrorBox
        message={`Connectivity error: ${connectivityError}`}
        description="Please check your internet connection and try again."
        actionButton={
          <button
            onClick={checkConnectivity}
            className="px-3 py-1.5 bg-[--interactive-accent] text-[--text-on-accent] rounded hover:bg-[--interactive-accent-hover] transition-colors duration-200"
          >
            Retry Connection
          </button>
        }
      />
    );
  }

  return null;
}; 