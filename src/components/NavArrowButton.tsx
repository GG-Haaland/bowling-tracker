import { useState } from 'react';

interface NavArrowButtonProps {
  direction: 'left' | 'right';
  onClick: () => void;
  size?: 'small' | 'medium';
}

export default function NavArrowButton({ direction, onClick, size = 'medium' }: NavArrowButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const dim = size === 'small' ? '2em' : '2.4em';
  const strokeW = size === 'small' ? 2.5 : 3;
  const points = direction === 'left' ? '8,2 3,7 8,12' : '3,2 8,7 3,12';

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        width: dim,
        height: dim,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        border: `1px solid ${hovered ? 'var(--yellow)' : 'var(--soft-black)'}`,
        borderRadius: '50%',
        background: hovered ? 'var(--medium-black)' : 'var(--dark-black)',
        color: hovered ? 'var(--yellow)' : 'var(--smoke)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        transform: pressed ? 'scale(0.9)' : 'scale(1)',
        outline: 'none',
        padding: 0,
      }}
    >
      <svg
        width="11"
        height="14"
        viewBox="0 0 11 14"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeW}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points={points} />
      </svg>
    </button>
  );
}