import React from 'react';
import { KPICardDTO } from '../../models';


interface Props {
  cards: KPICardDTO[];
}

export const KPICards: React.FC<Props> = ({ cards }) => {
  const getIcon = (icon?: string) => {
    switch (icon) {
      case 'attendance': return '📊';
      case 'students': return '👨‍🎓';
      case 'lessons': return '📚';
      case 'trend-up': return '📈';
      case 'trend-down': return '📉';
      default: return '📊';
    }
  };

  const getColor = (color?: string) => {
    switch (color) {
      case 'success': return '#4caf50';
      case 'warning': return '#ff9800';
      case 'danger': return '#f44336';
      case 'info': return '#2196f3';
      default: return '#757575';
    }
  };

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
      margin: '20px 0'
    }}>
      {cards.map((card, index) => (
        <div 
          key={index} 
          style={{ 
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            borderLeft: `4px solid ${getColor(card.color)}`
          }}
        >
          <div style={{ fontSize: '32px', marginRight: '20px' }}>
            {getIcon(card.icon)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
              {card.title}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333' }}>
              {card.value}
            </div>
            {card.trend && (
              <div style={{ 
                fontSize: '12px', 
                marginTop: '5px',
                color: card.trend.startsWith('+') ? '#4caf50' : '#f44336' 
              }}>
                {card.trend}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};