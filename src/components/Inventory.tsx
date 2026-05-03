import type { PlayerState } from '../game/types';
import { ITEM_NAMES } from '../game/items';

interface Props {
  player: PlayerState;
}

export function Inventory({ player }: Props) {
  if (player.inventory.length === 0) {
    return <div className="inventory empty">CARRYING: nothing</div>;
  }
  return (
    <div className="inventory">
      <span className="inventory-label">CARRYING:</span>
      {player.inventory.map(item => (
        <span key={item} className="inventory-item">{ITEM_NAMES[item]}</span>
      ))}
    </div>
  );
}
