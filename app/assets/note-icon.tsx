import * as React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

interface NoteIconProps {
    width?: number;
    height?: number;
    color?: string;
}

export default function NoteIcon({
    width = 80,
    height = 80,
    color = '#FFFFFF'
}: NoteIconProps) {
    return (
        <Svg width={width} height={height} viewBox="0 0 80 80" fill="none">
            <Rect x="12" y="10" width="48" height="60" fill="#FFFFFF" opacity="0.9" />
            <Path
                d="M18 20H54M18 30H54M18 40H40M18 50H48"
                stroke="#333333"
                strokeWidth="2"
            />
            <Path
                d="M60 20L68 28L50 46L42 48L44 40L60 20Z"
                fill="#FFD700"
                stroke="#333333"
                strokeWidth="1"
            />
        </Svg>
    );
} 