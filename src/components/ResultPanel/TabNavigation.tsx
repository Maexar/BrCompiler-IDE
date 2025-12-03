//import { ReactNode } from 'react';
import styles from './TabNavigation.module.css';

export type TabId = 'resultado' | 'tokens' | 'arvore';

export interface Tab {
  id: TabId;
  label: string;
  icon?: string;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
}

export function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className={styles['tab-navigation']}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`${styles['tab-button']} ${
            activeTab === tab.id ? styles['active'] : ''
          }`}
          onClick={() => onTabChange(tab.id)}
          aria-selected={activeTab === tab.id}
          role="tab"
        >
          {tab.icon && <span className={styles['tab-icon']}>{tab.icon}</span>}
          <span className={styles['tab-label']}>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
