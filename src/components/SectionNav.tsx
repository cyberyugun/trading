import React from 'react';
import { motion } from 'framer-motion';

interface SectionNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const sections = [
  { id: 'chart', label: 'Chart & Technical' },
  { id: 'backtesting', label: 'Backtesting' },
  { id: 'recommendations', label: 'Recommendations' },
  { id: 'support-resistance', label: 'Support/Resistance' },
  { id: 'fibonacci', label: 'Fibonacci' },
  { id: 'risk', label: 'Risk' },
  { id: 'dca', label: 'DCA' },
  { id: 'orderbook', label: 'Order Book' },
  { id: 'alerts', label: 'Alerts' }
];

const SectionNav: React.FC<SectionNavProps> = ({ activeSection, onSectionChange }) => {
  return (
    <nav className="sticky top-0 z-10 bg-[rgb(var(--card-bg))] border-b border-[rgb(var(--card-border))] mb-8">
      <div className="container mx-auto px-4">
        <div className="flex space-x-1 overflow-x-auto py-2 scrollbar-hide">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`relative px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeSection === section.id
                  ? 'text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {section.label}
              {activeSection === section.id && (
                <motion.div
                  layoutId="activeSection"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default SectionNav; 