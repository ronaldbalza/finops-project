import { useEffect, useRef } from 'react';
import * as pbi from 'powerbi-client';
import { models } from 'powerbi-client';

interface PowerBIEmbedProps {
  embedToken: string;
  embedUrl: string;
  reportId: string;
  isFullscreen: boolean;
}

export default function PowerBIEmbed({ embedToken, embedUrl, reportId, isFullscreen }: PowerBIEmbedProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const powerbiRef = useRef<pbi.service.Service | null>(null);
  const reportInstanceRef = useRef<pbi.Report | null>(null);

  // Cleanup function to properly reset the embed
  const cleanup = () => {
    if (powerbiRef.current && reportRef.current) {
      try {
        powerbiRef.current.reset(reportRef.current);
        reportInstanceRef.current = null;
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    }
  };

  useEffect(() => {
    if (!reportRef.current || !embedToken) {
      console.error('Missing required props or DOM element');
      return;
    }

    // Clean up any existing embed before creating a new one
    cleanup();

    // Initialize PowerBI
    powerbiRef.current = new pbi.service.Service(
      pbi.factories.hpmFactory,
      pbi.factories.wpmpFactory,
      pbi.factories.routerFactory
    );

    const config: models.IEmbedConfiguration = {
      type: 'report',
      tokenType: models.TokenType.Embed,
      accessToken: embedToken,
      embedUrl: embedUrl,
      id: reportId,
      permissions: models.Permissions.All,
      settings: {
        panes: {
          filters: {
            expanded: false,
            visible: false
          },
          pageNavigation: {
            visible: false
          }
        },
        bars: {
          actionBar: {
            visible: false
          }
        },
        navContentPaneEnabled: false,
        background: models.BackgroundType.Transparent
      }
    };

    // Small delay to ensure proper cleanup
    const embedTimer = setTimeout(() => {
      try {
        if (reportRef.current && powerbiRef.current) {
          reportInstanceRef.current = powerbiRef.current.embed(
            reportRef.current,
            config
          ) as pbi.Report;
        }
      } catch (error) {
        console.error('Error embedding report:', error);
      }
    }, 100);

    return () => {
      clearTimeout(embedTimer);
      cleanup();
    };
  }, [embedToken, embedUrl, reportId]);

  // Handle fullscreen changes
  useEffect(() => {
    const report = reportInstanceRef.current;
    if (!report) return;

    try {
      if (isFullscreen) {
        report.fullscreen();
      } else {
        report.exitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  }, [isFullscreen]);

  return (
    <div 
      ref={reportRef} 
      style={{ 
        height: '75vh',
        width: '100%',
        border: '0',
      }}
    />
  );
} 