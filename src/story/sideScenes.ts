/**
 * Short scenes for the side areas (played the first time you walk into
 * one, over its painting: see art/hd/people.ts) and the two paintings the
 * Games tab's tales end on.
 */
import type { Backdrop, Scene, SceneStep } from './scenes'

const arrival = (map: string, title: string, bg: Backdrop, steps: SceneStep[]): Scene => ({
  id: `arrive-${map}`,
  title,
  bg,
  cast: ['you', 'fude'],
  steps: [{ pause: 500 }, ...steps],
})

export const SIDE_SCENES: Scene[] = [
  arrival('village-bamboo', 'The Whispering Bamboo Grove', 'village', [
    { jp: 'さらさら… たけが ささやいて いる。', en: 'Sara-sara… the bamboo is whispering.' },
    { who: 'fude', emote: '?', jp: 'あの こやの まきもの… なかで なにか うごいてない？', en: 'That scroll by the hut… isn’t something moving inside it?' },
  ]),
  arrival('village-terraces', 'The Riverside Terraces', 'village', [
    { jp: 'たんぼに そらが うつって、かがみの かいだんみたい。', en: 'The paddies hold the sky like a staircase of mirrors.' },
    { who: 'fude', emote: '♪', jp: 'みず、こめ、かわ… ここは ことばで いっぱい だね！', en: 'Water, rice, river… this place is full of words!' },
  ]),
  arrival('fields-hill', 'Windmill Hill', 'fields', [
    { jp: 'おかの うえで、かざぐるまが とまって いる。', en: 'On the hilltop, the windmill stands still.' },
    { who: 'fude', jp: 'かぜが ふけば まわるのに… だれか、こまって ないかな。', en: 'It would turn if the wind blew… I wonder if someone needs help.' },
  ]),
  arrival('forest-hollow', 'Mushroom Hollow', 'forest', [
    { jp: 'ひかる きのこが、ちいさな ちょうちんの ように ならんで いる。', en: 'Glowing mushrooms line the way like little lanterns.' },
    { who: 'fude', emote: '…', jp: 'しーっ。たぬきが ねてる。', en: 'Shh. A tanuki is sleeping.' },
  ]),
  arrival('forest-lake', 'Misty Lake', 'forest', [
    { jp: 'みずうみに きりが かかって、むこうぎしが みえない。', en: 'Mist lies on the lake; the far shore is gone.' },
    { who: 'fude', jp: 'きりの かねが ある。…まつのも、だいじな ことば だね。', en: 'There’s a mist bell. …Waiting is an important word too.' },
  ]),
  arrival('shrine-torii', 'The Path of a Thousand Torii', 'shrine', [
    { jp: 'あかい とりいが、どこまでも つづいて いる。', en: 'Red torii gates go on and on and on.' },
    { who: 'fude', emote: '!', jp: 'いちばん うえまで いける？ きつねが みてるよ。', en: 'Can we reach the very top? The foxes are watching.' },
  ]),
  arrival('shrine-garden', 'The Moss Garden Teahouse', 'shrine', [
    { jp: 'すなの もようが、なみの ように しずか。', en: 'The patterns in the sand lie as quiet as waves.' },
    { who: 'fude', jp: 'ここでは、しずかでも さびしく ないね。', en: 'Here, even the quiet doesn’t feel lonely.' },
  ]),
  arrival('tower-garden', 'The Castle Garden', 'tower', [
    { jp: 'とうの ねもとに、ひみつの にわが あった。', en: 'At the foot of the tower, a secret garden.' },
    { who: 'fude', emote: '?', jp: 'まんなかの ばらだけ、しおれてる… どうして だろう。', en: 'Only the rose in the middle has wilted… I wonder why.' },
  ]),
  {
    id: 'sumi-kotone',
    title: 'Memory: The Brush and the Sword',
    bg: 'village',
    art: 'sumi-kotone',
    memory: true,
    music: 'title',
    cast: ['sumi', 'kotone', 'fude'],
    steps: [
      { jp: 'むかし。たけやぶに、ぼっけんと ふでが ぶつかる おとが ひびいた。', en: 'Long ago, the clack of a wooden sword on a brush rang through the bamboo.' },
      { who: 'sumi', jp: 'また まけたな、コトネ。もう やめるか？', en: 'You lost again, Kotone. Will you give up?' },
      { who: 'kotone', emote: '♪', jp: 'やめない！ だって、まけた ぶん だけ あたらしい ことばを おぼえたもん。', en: 'Never! Every time I lose, I learn a new word.' },
      { flash: '#fff6d0', jp: 'ことねの ふでが かいた「なかま」の じが、ふたりの あいだで ひかった。', en: 'The word Kotone wrote, nakama, friends, glowed between them.' },
      { who: 'fude', emote: '…', jp: '…この ひかり、おぼえてる。ぼくは あの ときも そこに いたんだ。', en: '…I remember that light. I was there that day too.' },
    ],
  },
  {
    id: 'valley-home',
    title: 'The Valley Comes Home',
    bg: 'fields',
    art: 'valley-home',
    cast: ['tane', 'you', 'fude'],
    steps: [
      { pause: 500 },
      { jp: 'たにに、わらいごえが もどって きた。', en: 'Laughter has come back to the valley.' },
      { who: 'tane', emote: '♥', jp: 'みんな、ことばを みつけて かえって きたんだね…。', en: 'Everyone found their words and came home…' },
      { who: 'fude', emote: '♪', jp: 'なまえを よびあえる ばしょが あれば、ひとは もどって くるんだね。', en: 'When there’s a place where people call each other by name, they come back.' },
    ],
  },
]
