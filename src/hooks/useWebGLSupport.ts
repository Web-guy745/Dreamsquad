import { useEffect, useState } from 'react';

/**
 * Detects whether the current browser/device can run WebGL.
 * Used to gate the React Three Fiber hero scene so the rest of the
 * landing page still renders correctly on devices/browsers without it.
 */
function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    return Boolean(gl);
  } catch {
    return false;
  }
}

export function useWebGLSupport(): boolean {
  const [supported, setSupported] = useState<boolean>(true);

  useEffect(() => {
    setSupported(detectWebGL());
  }, []);

  return supported;
}
