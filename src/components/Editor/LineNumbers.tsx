import { forwardRef } from 'react';
import styles from './LineNumbers.module.css';

interface LineNumbersProps {
  lineCount: number;
}

export const LineNumbers = forwardRef<HTMLDivElement, LineNumbersProps>(
  ({ lineCount }, ref) => {
    return (
      <div className={styles['line-numbers']} ref={ref}>
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i + 1} className={styles['line-number']}>
            {i + 1}
          </div>
        ))}
      </div>
    );
  }
);

LineNumbers.displayName = 'LineNumbers';
