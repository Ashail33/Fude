import type { RegionScenes } from '../types'

/**
 * Region 7 cutscenes. Haruko (はるこ) is the proprietress of the oldest inn,
 * Jiro her son at the bath-house, Saru the old snow monkey who rules the
 * rock bath, and the Yamanba the mountain woman who once shared her hot
 * water with travellers, until the hungry quiet passed over her mountain.
 *
 * The memory pages: Kotone names the steam, the breath between hot and cold,
 * and finds that a name need not hold a thing still; and the Yamanba, long
 * ago, tells an exhausted Kotone that she may rest — the gentle “〜てもいい”
 * that she will one day want to say to the quiet itself.
 */
export const SCENES: RegionScenes = {
  speakers: {
    haru: { sprite: 'okami', name: 'Haruko', jp: 'はるこ', color: '#e58f65' },
    jiro: { sprite: 'child', name: 'Jiro', jp: 'じろう', color: '#f2b37a' },
    saru: { sprite: 'monkey', name: 'Saru', jp: 'サル', color: '#c9a27e' },
    yamanba: { sprite: 'yamanba', name: 'The Yamanba', jp: 'やまんば', color: '#b5523b' },
  },
  pages: [
    { scene: 'memory-r7-a', region: 7, kind: 'core', title: 'The Breath of the Water', jp: 'ゆの いき' },
    { scene: 'memory-r7-b', region: 7, kind: 'bonus', title: 'You May Rest', jp: 'やすんでも いいよ' },
  ],
  scenes: [
    {
      id: 'arrive-onsen',
      title: 'The Hot-Spring Hollow',
      bg: 'onsen',
      music: 'onsen',
      cast: ['you', 'fude'],
      steps: [
        { pause: 500 },
        { jp: 'ゆげの においが する。ゆきの 上を、しろい いきが ながれて いく。', kana: 'ゆげの においが する。ゆきの うえを、しろい いきが ながれて いく。', en: 'The air smells of steam. White breath drifts across the snow.' },
        { who: 'fude', emote: '♪', jp: 'ここは 湯の里！ おんせんの むら だよ！', kana: 'ここは ゆのさと！ おんせんの むら だよ！', en: 'This is the Hot-Spring Hollow, a village of hot springs!' },
        { enter: 'saru', pause: 300 },
        { who: 'saru', emote: '!', jp: 'キキッ！', en: 'Kik-kik! (A snow monkey with a towel on its head blocks the path.)' },
        { who: 'saru', jp: 'たびびとか。…わるい ときに きたな。', en: 'A traveller, eh. …You came at a bad time.' },
        { who: 'saru', jp: 'やまんばが、さとの ことばを むすんで しまった。きのうの ことを、だれも いえん。', en: 'The Yamanba has tied the Hollow’s words in knots. Nobody can say what they did yesterday.' },
        { enter: 'haru', pause: 300 },
        { who: 'haru', jp: 'いらっしゃいませ。…ごめんなさい。いま、さとは すこし もつれて いるの。', en: 'Welcome. …I’m sorry. The Hollow is a little tangled just now.' },
        { who: 'haru', jp: 'うちの 旅館で 休んで いって ください。お風呂の きまりも、おしえますね。', kana: 'うちの りょかんで やすんで いって ください。おふろの きまりも、おしえますね。', en: 'Please rest at our inn. I’ll teach you the bath rules, too.' },
        { who: 'fude', emote: '!', jp: '「て」の かたちで、むすびめを ほどこう！ 〜て、〜て… ことばが つながるよ。', en: 'Let’s untie the knots with the て-form! 〜て, 〜て… that’s how words link up.' },
      ],
    },
    {
      id: 'pre-boss-r7',
      title: 'The Knotting Yamanba',
      bg: 'onsen',
      music: 'boss',
      cast: ['you', 'fude'],
      steps: [
        { jp: 'いわやの おくで、なべが ぐつぐつ にえている。', en: 'Deep in the cave, a pot bubbles and bubbles.' },
        { enter: 'yamanba', shake: true, pause: 500 },
        { who: 'yamanba', emote: '♪', jp: 'ひっひっひ。よく きたねえ。', en: 'Hee hee hee. So, you came.' },
        { who: 'yamanba', jp: 'あたしは やまんば。さとの ことばを むすんで、きのうを ぜんぶ たべて やった。', en: 'I am the Yamanba. I tied the Hollow’s words in knots and ate every last yesterday.' },
        { who: 'yamanba', jp: 'きのうが なければ、だれも つかれない。だれも かなしく ない。ずっと「いま」だけ。いい だろう？', en: 'Without yesterday, nobody gets tired. Nobody is sad. Only “now”, forever. Isn’t that nice?' },
        { who: 'fude', emote: '💢', jp: 'よく ない！ きのうが あるから、「ただいま」も「おつかれさま」も いえるんだ！', en: 'It is not! Because there was a yesterday, we can say “I’m home” and “thank you for today”!' },
        { who: 'yamanba', emote: '!', jp: 'なら、ほどいて ごらん。あたしの むすびめを！', en: 'Then untie them, if you can. My knots!' },
      ],
    },
    {
      id: 'post-boss-r7',
      title: 'Yesterday Returns',
      bg: 'onsen',
      music: 'onsen',
      cast: ['you', 'fude', 'yamanba'],
      steps: [
        { who: 'yamanba', emote: '…', jp: '…ほどけた。ぜんぶ、ほどけちまった。', en: '…Untied. Every last knot.' },
        { who: 'yamanba', jp: 'あたしも むかしは、たびびとに おゆを わけて いた。…いつから、わすれて いたんだろうね。', en: 'Long ago I used to share my hot water with travellers. …When did I forget?' },
        { who: 'yamanba', jp: 'しずかな ものが、はらを すかせて、この やまを とおった。それから、きのうが にがく なって…', en: 'Something quiet passed over this mountain, hungry. After that, every yesterday tasted bitter…' },
        { who: 'fude', emote: '…', jp: 'しずかな もの… あの りゅうだ。', en: 'Something quiet… the dragon.' },
        { flash: '#ffe0c0', jp: 'さとじゅうで、ゆげが いっせいに たちのぼった。', en: 'All across the Hollow, the steam rises at once.' },
        { enter: 'haru', pause: 300 },
        { who: 'haru', emote: '♪', jp: 'みんなが、きのうの ことを はなして います。…おかえりなさい、やまんばさん。', en: 'Everyone is talking about yesterday again. …Welcome back, Yamanba.' },
        { who: 'yamanba', emote: '♥', jp: '…ただいま。', en: '…I’m home.' },
        { who: 'fude', emote: '!', jp: 'つぎは、ひがしの じょうかまち！ ていねいな ことばの まち だよ。', en: 'Next stop: the Castle Town to the east, a town of polite words!' },
      ],
    },
    {
      id: 'memory-r7-a',
      title: 'Memory: The Breath of the Water',
      bg: 'onsen',
      memory: true,
      music: 'title',
      cast: ['scribe', 'fude'],
      steps: [
        { pause: 900 },
        { jp: 'ゆきの よる。ふるい いわぶろから、しろい ゆげが のぼって いた。', en: 'A snowy night, long ago. White steam was rising from an old rock bath.' },
        { who: 'scribe', emote: '?', jp: 'ねえ フデ、これは なに？ みずでも ない、かぜでも ない。', en: 'Hey, Fude, what is this? It isn’t water, and it isn’t wind.' },
        { who: 'fude', jp: 'あつい お湯と、つめたい そらの あいだに いる もの…？', kana: 'あつい おゆと、つめたい そらの あいだに いる もの…？', en: 'Something that lives between the hot water and the cold sky…?' },
        { who: 'scribe', emote: '…', jp: 'あいだの もの…。なまえを つけたら、きえちゃうかな。', en: 'An in-between thing… If I name it, will it disappear?' },
        { jp: 'ことねは ふでを ゆげに むけて、そっと かいた。「ゆげ」。', en: 'Kotone raised the brush toward the steam and wrote, very gently: “yuge”.' },
        { flash: '#fff6d0', jp: 'もじは ゆげに とけて、ふわりと そらへ のぼって いった。', en: 'The letters melted into the steam and drifted up into the sky.' },
        { who: 'scribe', emote: '♪', jp: 'みて！ なまえが あっても、ゆげは ゆげの まま。きえたい ときに、ちゃんと きえる。', en: 'Look! Even with a name, the steam is still steam. It still fades away whenever it likes.' },
        { who: 'scribe', jp: 'なまえって、とじこめる ものじゃ ないのかも…', en: 'Maybe a name isn’t a cage after all…' },
        { bg: 'void', jp: '……', en: '…The memory fades.' },
        { who: 'fude', emote: '!', jp: 'ことねは ここで まなんだんだ。なまえを つけても、しずかな ものは しずかな ままで いられるって。', en: 'Kotone learned it here: you can name a quiet thing, and it can still stay quiet.' },
      ],
    },
    {
      id: 'memory-r7-b',
      title: 'Memory: You May Rest',
      bg: 'onsen',
      memory: true,
      music: 'title',
      cast: ['scribe', 'fude'],
      steps: [
        { jp: 'ある ばん、ことねは ゆきみちで、もう いっぽも あるけなく なった。', en: 'One night on the snowy road, Kotone could not walk another step.' },
        { who: 'scribe', emote: '…', jp: 'まだ… かかなきゃ。なまえの ない ものが、まだ たくさん…', en: 'I still… have to write. There are still so many things without names…' },
        { enter: 'yamanba', who: 'yamanba', jp: 'おや、ちいさな たびびと。ふるえて いるじゃ ないか。', en: 'Well now, a little traveller. You’re shivering.' },
        { who: 'yamanba', emote: '♥', jp: 'おいで。お湯に つかって、やすんでも いいんだよ。', kana: 'おいで。おゆに つかって、やすんでも いいんだよ。', en: 'Come here. You may soak in the hot water and rest.' },
        { who: 'scribe', emote: '?', jp: 'やすんでも… いいの？ なにも しなくても？', en: 'I may… rest? Even without doing anything?' },
        { enter: 'saru', who: 'saru', jp: 'キキッ。', en: 'Kik-kik. (Every monkey in the bath is doing exactly that.)' },
        { who: 'scribe', emote: '♪', jp: '「〜ても いい」って、やさしい ことばだね。', en: '“It’s all right to…” What a gentle way of speaking.' },
        { who: 'scribe', jp: 'いつか、あの しずけさにも いって あげたい。「しずかで いても いいよ」って。', en: 'Someday I want to say it to the quiet, too: “It’s all right to be quiet.”' },
        { bg: 'void', exit: 'scribe', jp: '……', en: '…The memory fades.' },
        { who: 'fude', emote: '…', jp: 'しずかで いても いい… ことねが さがして いた なまえに、ちかづいて いる きが する。', en: 'It’s all right to be quiet… I feel we’re getting closer to the name Kotone was looking for.' },
      ],
    },
  ],
}
