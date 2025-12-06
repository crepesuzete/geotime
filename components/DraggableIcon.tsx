import React from 'react';
import { TacticalIconDef } from '../types';

interface Props {
  def: TacticalIconDef;
  onDragStart: (e: React.DragEvent, type: string) => void;
}

export const DraggableIcon: React.FC<Props> = ({ def, onDragStart }) => {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, def.type)}
      className="flex flex-col items-center justify-center p-2 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-grab active:cursor-grabbing transition-colors border border-gray-700 hover:border-blue-500"
    >
      <div className="p-2 rounded-full bg-white text-gray-900 mb-1" style={{ color: def.defaultColor }}>
        {def.iconNode}
      </div>
      <span className="text-xs text-gray-300 font-medium">{def.label}</span>
    </div>
  );
};