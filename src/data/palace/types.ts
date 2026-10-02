/**
 * The memory palace (method of loci). Each region is a room; each room is a
 * walking route through real places on its map (a landmark, an NPC, a
 * building's door). Every place holds a few memories: a kana, word or
 * grammar point bound to a vivid, slightly absurd image *at that place*.
 * Walking the route in order and seeing the images is how the items are
 * recalled.
 */
export interface Memory {
  /** SRS item id: `k:あ` kana, `w:<wordId>` word, `g:<id>` grammar, `j:<char>` kanji. */
  item: string
  /**
   * The image, in English, set at this place: what you see, hear, smell.
   * A sound-alike hook in CAPS links the image to the reading ("a SACK of
   * fish flops on the pier" for さかな). It never contains the item's own
   * Japanese characters, so it can be shown as a recall cue.
   */
  story: string
}

export interface Locus {
  id: string
  room: number
  map: string
  /** Entity id on `map` this place is anchored to. */
  anchor: string
  name: { jp: string; en: string }
  emoji: string
  memories: Memory[]
}
