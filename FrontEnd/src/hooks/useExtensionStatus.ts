import { useState, useEffect } from "react";
import { isExtensionAvailable } from "../lib/extension";

export function useExtensionStatus() {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    isExtensionAvailable().then((res) => {
      if (mounted) setAvailable(res);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return available;
}
