import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'fast'
  | 'history'
  | 'settings'
  | 'plus'
  | 'minus'
  | 'check'
  | 'chevron'
  | 'chevronLeft'
  | 'edit'
  | 'info'
  | 'heart'
  | 'bell'
  | 'flag'
  | 'export'
  | 'import'
  | 'trophy'
  | 'calendar'
  | 'clock'
  | 'close'
  | 'scale'
  | 'ruler'
  | 'sun'
  | 'folder'
  | 'plan'
  | 'journal'
  | 'lock';

/** Line icons drawn for Fastaway: 24 px grid, 1.75 stroke, round caps. No rings, no clocks faces as heroes. */
export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color: string }) {
  const p = {
    stroke: color,
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'fast' && <Path d="M12 4a8 8 0 1 1-6.93 4" {...p} strokeWidth={2.25} />}
      {name === 'history' && (
        <>
          <Rect x="3.5" y="5" width="17" height="15" rx="3" {...p} />
          <Line x1="3.5" y1="10" x2="20.5" y2="10" {...p} />
          <Line x1="8" y1="3" x2="8" y2="6.5" {...p} />
          <Line x1="16" y1="3" x2="16" y2="6.5" {...p} />
          <Line x1="7.5" y1="14.5" x2="13" y2="14.5" {...p} />
        </>
      )}
      {name === 'settings' && (
        <>
          <Line x1="4" y1="7" x2="20" y2="7" {...p} />
          <Line x1="4" y1="17" x2="20" y2="17" {...p} />
          <Circle cx="9" cy="7" r="2.25" {...p} fill={color} />
          <Circle cx="15" cy="17" r="2.25" {...p} fill={color} />
        </>
      )}
      {name === 'plus' && <Path d="M12 5v14M5 12h14" {...p} />}
      {name === 'minus' && <Path d="M5 12h14" {...p} />}
      {name === 'check' && <Path d="M5 12.5l4.5 4.5L19 7.5" {...p} />}
      {name === 'chevron' && <Path d="M9 5l7 7-7 7" {...p} />}
      {name === 'chevronLeft' && <Path d="M15 5l-7 7 7 7" {...p} />}
      {name === 'close' && <Path d="M6 6l12 12M18 6L6 18" {...p} />}
      {name === 'edit' && <Path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" {...p} />}
      {name === 'info' && (
        <>
          <Circle cx="12" cy="12" r="9" {...p} />
          <Path d="M12 11v6M12 7.5v.01" {...p} />
        </>
      )}
      {name === 'heart' && (
        <Path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0112 7.3 4.3 4.3 0 0119.5 10c0 5.4-7.5 10-7.5 10z" {...p} />
      )}
      {name === 'bell' && <Path d="M6 16V11a6 6 0 1112 0v5l1.5 2h-15L6 16zM10 20.5h4" {...p} />}
      {name === 'flag' && <Path d="M6 21V4M6 4h11l-2.5 4L17 12H6" {...p} />}
      {name === 'export' && (
        <Path d="M12 15V3M7.5 7.5L12 3l4.5 4.5M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6" {...p} />
      )}
      {name === 'import' && (
        <Path d="M12 3v12M7.5 10.5L12 15l4.5-4.5M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6" {...p} />
      )}
      {name === 'trophy' && (
        <Path
          d="M8 4h8v5a4 4 0 01-8 0V4zM8 6H5a3 3 0 003 4M16 6h3a3 3 0 01-3 4M12 13v4M8.5 20h7M10 17h4v3h-4z"
          {...p}
        />
      )}
      {name === 'calendar' && (
        <>
          <Rect x="3.5" y="5" width="17" height="15" rx="3" {...p} />
          <Line x1="3.5" y1="10" x2="20.5" y2="10" {...p} />
        </>
      )}
      {name === 'clock' && <Path d="M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" {...p} />}
      {name === 'lock' && (
        <>
          <Rect x="5" y="10.5" width="14" height="10" rx="2.5" {...p} />
          <Path d="M8.5 10.5V7.5a3.5 3.5 0 017 0v3" {...p} />
        </>
      )}
      {name === 'ruler' && <Path d="M4 16L16 4l4 4L8 20l-4-4zM8 12l2 2M11 9l2 2M14 6l2 2" {...p} />}
      {name === 'sun' && (
        <>
          <Circle cx="12" cy="12" r="4" {...p} />
          <Path
            d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"
            {...p}
          />
        </>
      )}
      {name === 'folder' && (
        <Path d="M3.5 7.5a2 2 0 012-2h4l2 2.5h7a2 2 0 012 2V17a2 2 0 01-2 2h-13a2 2 0 01-2-2V7.5z" {...p} />
      )}
      {name === 'plan' && (
        <>
          <Rect x="3.5" y="5" width="17" height="15" rx="3" {...p} />
          <Line x1="8" y1="3" x2="8" y2="6.5" {...p} />
          <Line x1="16" y1="3" x2="16" y2="6.5" {...p} />
          <Path d="M8 14h7M12.5 11.5L15 14l-2.5 2.5" {...p} />
        </>
      )}
      {name === 'journal' && (
        <>
          <Path d="M6.5 3.5h10a2 2 0 012 2v13a2 2 0 01-2 2h-10z" {...p} />
          <Line x1="6.5" y1="3.5" x2="6.5" y2="20.5" {...p} />
          <Line x1="10" y1="8.5" x2="15" y2="8.5" {...p} />
          <Line x1="10" y1="12" x2="15" y2="12" {...p} />
        </>
      )}
      {name === 'scale' && (
        <>
          <Rect x="3.5" y="4" width="17" height="16" rx="4" {...p} />
          <Path d="M8.5 9.5a5 5 0 017 0M12 9.5l1.5-1.5" {...p} />
        </>
      )}
    </Svg>
  );
}

/** The Fastaway mark: one ring, most of the way round, as on the app icon. */
export function BrandMark({ size = 28, color, accent }: { size?: number; color: string; accent?: string }) {
  const stroke = size * 0.2;
  const r = (size - stroke) / 2;
  const mid = size / 2;
  const circ = 2 * Math.PI * r;
  return (
    <Svg width={size} height={size}>
      <Circle
        cx={mid}
        cy={mid}
        r={r}
        stroke={accent ?? color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${circ * (300 / 360)} ${circ}`}
        transform={`rotate(-90 ${mid} ${mid})`}
        fill="none"
      />
    </Svg>
  );
}
