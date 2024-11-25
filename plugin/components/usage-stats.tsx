import React from "react";

interface UsageData {
  tokenUsage: number;
  maxTokenUsage: number;
  subscriptionStatus: string;
  currentPlan: string;
}

interface UsageStatsProps {
  usageData: UsageData;
}

export const UsageStats: React.FC<UsageStatsProps> = ({ usageData }) => {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className="setting-item">
      <div className="setting-item-info">
        <div className="setting-item-name">Token Usage</div>
        <div className="setting-item-description">
          Your current token usage and limits
        </div>
      </div>
      <div className="setting-item-control">
        <div className="token-usage-stats">
          <div className="usage-bar">
            <div 
              className="usage-progress"
              style={{
                width: `${(usageData.tokenUsage / usageData.maxTokenUsage) * 100}%`,
                backgroundColor: 'var(--interactive-accent)',
                height: '8px',
                borderRadius: '4px'
              }}
            />
          </div>
          <div className="usage-numbers">
            {formatNumber(usageData.tokenUsage)} / {formatNumber(usageData.maxTokenUsage)} tokens
          </div>
          <div className="usage-plan">
            Current Plan: {usageData.currentPlan || 'Free'}
          </div>
        </div>
      </div>
    </div>
  );
}; 