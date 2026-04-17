'use client';

import { useEffect } from 'react';

export default function AutoDownload() {
  useEffect(() => {
    // We trigger the download by creating a hidden anchor element
    const link = document.createElement('a');
    link.href = '/Mapa_Expansion_Mental_V2.pdf';
    link.download = 'Mapa_Expansion_Mental_V2.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  return null;
}
