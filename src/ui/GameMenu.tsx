/**
 * JRPG pause menu (CONTRACT). Opened from the overworld (Esc / menu button).
 * STUB. The UI implementation replaces it: command window with Status,
 * Items, Grimoire, Quests (Chronos + review + fading words), Mage (wardrobe),
 * World Map (fast travel list), Tavern, Settings.
 */
export interface GameMenuProps {
  onClose: () => void
  /** Fast travel: teleport the player to a map's entrance. */
  onTravel?: (mapId: string) => void
}

export function GameMenu({ onClose }: GameMenuProps) {
  return (
    <div className="card" role="dialog">
      <button type="button" className="btn" onClick={onClose}>
        Close
      </button>
    </div>
  )
}
