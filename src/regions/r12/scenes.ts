import type { RegionScenes } from '../types'

/**
 * The Valley of Hearts' cutscenes. The dragon's hunger is eating the
 * valley's feelings: every face has frozen like a Noh mask. Hannya, the
 * mask of jealousy, freezes the smiles she envies, but under the rage is a
 * lonely grief. The memory pages: Kotone at this valley's festival long
 * ago, feeling happy and sad at once and finding a word for it (懐かしい),
 * and an old Noh mask that smiles when tilted up and weeps when tilted
 * down: one face that holds both, like the quiet she still has to name.
 */
export const SCENES: RegionScenes = {
  speakers: {
    kaede: { sprite: 'maskmaker', name: 'Kaede', jp: 'カエデ', color: '#e8a25c' },
    ren: { sprite: 'dancer', name: 'Ren', jp: 'レン', color: '#f2789f' },
    hotaru: { sprite: 'child', name: 'Hotaru', jp: 'ホタル', color: '#d8f27a' },
    hannya: { sprite: 'hannya', name: 'Hannya', jp: 'はんにゃ', color: '#c43a5a' },
  },

  pages: [
    { scene: 'memory-r12-a', region: 12, kind: 'core', title: 'Happy and Sad Together', jp: 'うれしくて、さびしい' },
    { scene: 'memory-r12-b', region: 12, kind: 'bonus', title: 'A Face That Is Both', jp: 'りょうほうの かお' },
  ],

  scenes: [
    {
      id: 'arrive-kokoro',
      title: 'The Valley of Hearts',
      bg: 'kokoro',
      music: 'kokoro',
      cast: ['you', 'fude'],
      steps: [
        { pause: 600 },
        { jp: 'やまの あいだに、あかい もみじの 谷が ひろがって いた。', kana: 'やまの あいだに、あかい もみじの たにが ひろがって いた。', en: 'Between the mountains lies a valley of red maples.' },
        { jp: 'ちょうちんが ゆれ、たいこの 音が とおくで きこえる。まつりの じゅんびだ。', kana: 'ちょうちんが ゆれ、たいこの おとが とおくで きこえる。まつりの じゅんびだ。', en: 'Paper lanterns sway, and far off a drum is beating. They are getting ready for a festival.' },
        { who: 'fude', emote: '♪', jp: 'わあ、きれい！ でも… なんだか しずかですね。', en: 'Wow, it’s beautiful! But… it’s strangely quiet.' },
        { enter: 'hotaru', pause: 300 },
        { who: 'hotaru', emote: '!', jp: 'ことばが 見える 人だ！ よかった… ずっと まって いたの！', kana: 'ことばが みえる ひとだ！ よかった… ずっと まって いたの！', en: 'Someone who can see words! Thank goodness… I’ve been waiting so long!' },
        { who: 'hotaru', jp: 'わたしは ホタル。この 谷の ほたるの こ。ねえ、むらの 人の 顔を 見て。', kana: 'わたしは ホタル。この たにの ほたるの こ。ねえ、むらの ひとの かおを みて。', en: 'I’m Hotaru, a firefly child of this valley. Look at the villagers’ faces.' },
        { jp: 'むらびとたちの 顔は、のうめんの ように かたまって いた。わらいも なきも しない。', kana: 'むらびとたちの かおは、のうめんの ように かたまって いた。わらいも なきも しない。', en: 'The villagers’ faces have set hard, like Noh masks. Nobody laughs. Nobody cries.' },
        { who: 'hotaru', emote: '…', jp: 'みんな、じぶんの きもちが いえなく なったの。だから けんかしても、なかなおり できない。', en: 'Nobody can say how they feel anymore. So when they quarrel, they can’t make up.' },
        { who: 'hotaru', jp: 'あさっては かぐらの まつり なのに、まいても めんに きもちが はいらないって…', en: 'The kagura festival is the day after tomorrow, but the dancers say they can’t put any feeling into the masks…' },
        { who: 'fude', emote: '…', jp: 'きもちを たべる りゅうの 空腹… ここまで きて いたんですね。', kana: 'きもちを たべる りゅうの くうふく… ここまで きて いたんですね。', en: 'The dragon’s hunger, eating feelings… so it reached even here.' },
        { who: 'fude', jp: '{name}さん、ここでは きもちの ことばを まなびましょう。じぶんの きもちも、ひとの きもちも、ただしく いえる ように！', kana: '{name}さん、ここでは きもちの ことばを まなびましょう。じぶんの きもちも、ひとの きもちも、ただしく いえる ように！', en: '{name}, here let’s learn the words for feelings, so we can say how we feel, and how others feel, truly!' },
        { who: 'you', jp: 'うん。わくわくするね！', en: 'Yeah. I’m excited!' },
        { who: 'hotaru', emote: '♥', jp: '「わくわく」… いま、すこしだけ 顔が あたたかく なった！', kana: 'わくわく… いま、すこしだけ かおが あたたかく なった！', en: '“Excited”… just now, my face felt a tiny bit warmer!' },
      ],
    },
    {
      id: 'pre-boss-r12',
      title: 'Hannya, the Mask of Jealousy',
      bg: 'kokoro',
      music: 'boss',
      cast: ['you', 'fude', 'ren'],
      steps: [
        { jp: 'かぐらでんの ぶたいに、ひとつの めんが うかんで いた。', kana: 'かぐらでんの ぶたいに、ひとつの めんが うかんで いた。', en: 'Above the stage of the kagura hall, a single mask is floating.' },
        { enter: 'hannya', flash: '#c43a5a', shake: true, pause: 500 },
        { who: 'hannya', emote: '💢', jp: 'わらうな！ わらうな！ みんなの えがおが、うらやましくて たまらない！', kana: 'わらうな！ わらうな！ みんなの えがおが、うらやましくて たまらない！', en: 'Stop laughing! Stop it! I envy your smiles so much I can’t bear it!' },
        { who: 'ren', emote: '!', jp: 'はんにゃの めん… かぐらで いちばん こわい めん！', kana: 'はんにゃの めん… かぐらで いちばん こわい めん！', en: 'The Hannya mask… the most frightening mask in all of kagura!' },
        { who: 'hannya', jp: 'くろい こえが いった。「みんなの 顔を こおらせれば、もう うらやましく ない」と。', kana: 'くろい こえが いった。みんなの かおを こおらせれば、もう うらやましく ない と。', en: 'A dark voice told me: “Freeze everyone’s faces, and you won’t envy them anymore.”' },
        { who: 'fude', emote: '…', jp: 'りゅうの こえ… でも、あの 目… おこって いるだけじゃ ない みたい。', kana: 'りゅうの こえ… でも、あの め… おこって いるだけじゃ ない みたい。', en: 'The dragon’s voice… but those eyes… she doesn’t seem to be only angry.' },
        { who: 'ren', jp: 'はんにゃは、いかりの めん。でも、すこし したを むくと… ないて いる ように 見えるの。', kana: 'はんにゃは、いかりの めん。でも、すこし したを むくと… ないて いる ように みえるの。', en: 'Hannya is the mask of rage. But when she tilts her head down a little… she looks like she’s crying.' },
        { who: 'fude', jp: '{name}さん、きもちに ほんとうの なまえを つけましょう！ じぶんの きもちも、はんにゃの きもちも！', kana: '{name}さん、きもちに ほんとうの なまえを つけましょう！ じぶんの きもちも、はんにゃの きもちも！', en: '{name}, let’s give each feeling its true name! Ours, and Hannya’s too!' },
        { who: 'you', jp: 'まかせて！', en: 'Leave it to me!' },
      ],
    },
    {
      id: 'post-boss-r12',
      title: 'Under the Mask',
      bg: 'kokoro',
      music: 'kokoro',
      cast: ['you', 'fude', 'ren', 'hannya'],
      steps: [
        { who: 'hannya', emote: '…', jp: '……ひとりは、いやだった。', en: '……I didn’t want to be alone.' },
        { jp: 'つのが ほろほろと くずれ、めんの したから、なみだに ぬれた 女の 人の 顔が あらわれた。', kana: 'つのが ほろほろと くずれ、めんの したから、なみだに ぬれた おんなの ひとの かおが あらわれた。', en: 'Her horns crumble away, and from under the mask appears a woman’s face, wet with tears.' },
        { who: 'hannya', jp: 'わたしは むかし、この 谷の まいてだった。だれも おぼえて いない。だから、わらう みんなが うらやましくて…', kana: 'わたしは むかし、この たにの まいてだった。だれも おぼえて いない。だから、わらう みんなが うらやましくて…', en: 'Long ago I was a dancer of this valley. No one remembers me. So I envied everyone who laughed…' },
        { who: 'ren', jp: 'わすれないよ。ことしの まつりは、あなたと いっしょに おどる。', kana: 'わすれないよ。ことしの まつりは、あなたと いっしょに おどる。', en: 'We won’t forget you. This year, I’ll dance the festival with you.' },
        { who: 'hannya', emote: '♥', jp: '…いっしょに？ …うれしくて、なみだが とまらない。', kana: 'いっしょに？ うれしくて、なみだが とまらない。', en: '…Together? …I’m so happy, the tears won’t stop.' },
        { flash: '#f4ecd8', jp: 'たにじゅうで、こおった 顔が とけて いく。わらい声と なき声が、いっしょに きこえた。', kana: 'たにじゅうで、こおった かおが とけて いく。わらいごえと なきごえが、いっしょに きこえた。', en: 'All across the valley, frozen faces are melting. Laughter and crying ring out together.' },
        { who: 'fude', emote: '♪', jp: 'きもちが もどった！ うれしいのに、なきそう…', kana: 'きもちが もどった！ うれしいのに、なきそう…', en: 'The feelings are back! I’m happy, and yet I feel like crying…' },
        { who: 'hannya', jp: 'ちいさな まどうしよ、ありがとう。ひがしの やまを 見て。くもの 上に、とうが 見えるでしょう。', kana: 'ちいさな まどうしよ、ありがとう。ひがしの やまを みて。くもの うえに、とうが みえるでしょう。', en: 'Little mage, thank you. Look at the eastern mountains. Can you see a tower above the clouds?' },
        { who: 'hannya', jp: 'そうぞうの とう。りゅうは、あそこで まって いる。', kana: 'そうぞうの とう。りゅうは、あそこで まって いる。', en: 'The Tower of Creation. The dragon is waiting there.' },
        { who: 'fude', emote: '!', jp: 'さいごの たび… 創造の 塔へ。ことねが、さいごに いった ばしょ。', kana: 'さいごの たび… そうぞうの とうへ。ことねが、さいごに いった ばしょ。', en: 'The last journey… to the Tower of Creation. The last place Kotone went.' },
        { who: 'you', jp: 'こわい？', en: 'Are you scared?' },
        { who: 'fude', jp: 'すこし。でも、わくわくも して います。…どっちも ほんとうの きもちです。', en: 'A little. But I’m excited too. …Both are true feelings.' },
        { who: 'ren', emote: '♪', jp: 'いってらっしゃい！ かえって きたら、まつりで おどって あげる！', en: 'Off you go! When you come back, I’ll dance for you at the festival!' },
      ],
    },

    // ─── Memory pages ──────────────────────────────────────────────────
    {
      id: 'memory-r12-a',
      title: 'Memory: Happy and Sad Together',
      bg: 'kokoro',
      memory: true,
      music: 'title',
      cast: ['fude'],
      steps: [
        { pause: 900 },
        { jp: 'むかしむかし、こころの 谷の あきまつり。さいごの かぐらが おわった よる。', kana: 'むかしむかし、こころの たにの あきまつり。さいごの かぐらが おわった よる。', en: 'Long, long ago, at the autumn festival of the Valley of Hearts. The night the last kagura dance ended.' },
        { enter: 'scribe', who: 'scribe', emote: '♪', jp: 'たのしかったね、フデ。たいこも、おどりも、りんごあめも！', en: 'That was fun, Fude. The drums, the dancing, the candy apples!' },
        { who: 'fude', jp: 'うん！ …でも ことね、どうして ないて いるの？', en: 'Yeah! …But Kotone, why are you crying?' },
        { who: 'scribe', emote: '…', jp: 'わからない。たのしかったのに、おわって しまって… うれしくて、さびしいの。', en: 'I don’t know. It was so much fun, and now it’s over… I’m happy, and lonely.' },
        { who: 'scribe', jp: 'うれしいと かなしいの あいだの きもち。これにも、なまえが あるのかな。', en: 'A feeling between happy and sad. Does this one have a name too?' },
        { jp: 'まつりの あとの 谷に、しずけさが おりて きた。', kana: 'まつりの あとの たにに、しずけさが おりて きた。', en: 'Over the valley after the festival, the quiet settles down.' },
        { enter: 'shadow', who: 'shadow', emote: '…', jp: '…………。', en: '(Something small and dusk-coloured sits at the edge of the lantern light, watching the empty stage.)' },
        { who: 'scribe', jp: 'あなたも、まつりの あとが すき？ しずかで、ちょっと さびしくて… でも、あたたかいね。', en: 'Do you like the after-festival too? Quiet, and a little lonely… but warm, isn’t it?' },
        { who: 'scribe', emote: '!', jp: 'わかった。「なつかしい」だ。もう おわった ことが、だいじで、あたたかくて、すこし いたい きもち。', en: 'I know. Natsukashii. The feeling of something already over being precious, and warm, and hurting just a little.' },
        { who: 'scribe', jp: 'しずけさも、からっぽじゃ ないんだね。いろんな きもちが、いっしょに はいって いる。', en: 'So the quiet isn’t empty either. All kinds of feelings live in it together.' },
        { exit: 'shadow', jp: 'ちょうちんの ひが、ひとつ ずつ きえて いった。', en: 'One by one, the paper lanterns go out.' },
        { exit: 'scribe', bg: 'void', jp: '……', en: '…The memory fades.' },
        { who: 'fude', emote: '♥', jp: 'ことねは、しずけさに きもちが ある ことを しって いた…', en: 'Kotone knew that the quiet has feelings in it…' },
        { who: 'fude', jp: 'りゅうも、からっぽで さびしかったんじゃ ない。いっぱい すぎて、なまえが なかったんだ。', en: 'The dragon wasn’t lonely because it was empty. It was too full, and had no name.' },
      ],
    },
    {
      id: 'memory-r12-b',
      title: 'Memory: A Face That Is Both',
      bg: 'kokoro',
      memory: true,
      music: 'title',
      cast: ['fude'],
      steps: [
        { pause: 800 },
        { jp: '谷の せいれいたちが おぼえて いた。むかし、めんうちの こうぼうに きた 女の子の こと。', kana: 'たにの せいれいたちが おぼえて いた。むかし、めんうちの こうぼうに きた おんなのこの こと。', en: 'The valley’s spirits remembered. Long ago, a girl came to the mask carver’s workshop.' },
        { enter: 'scribe', who: 'scribe', emote: '?', jp: 'この めん、ふしぎ。わらって いるの？ ないて いるの？', kana: 'この めん、ふしぎ。わらって いるの？ ないて いるの？', en: 'This mask is strange. Is it laughing? Or crying?' },
        { enter: 'elder', who: 'elder', jp: 'ほら、上を むけると えがお。下を むけると、なみだ。', kana: 'ほら、うえを むけると えがお。したを むけると、なみだ。', en: 'Look: tilt it up and it smiles. Tilt it down, and it weeps.' },
        { who: 'elder', jp: 'いい めんは、きもちを ひとつに きめないの。見る 人の こころを うつすのよ。', kana: 'いい めんは、きもちを ひとつに きめないの。みる ひとの こころを うつすのよ。', en: 'A good mask doesn’t decide on one feeling. It reflects the heart of whoever looks at it.' },
        { who: 'scribe', emote: '!', jp: 'しずけさと おなじだ。かなしい とも、うれしい とも いえない。りょうほう なんだ。', en: 'Just like the quiet. You can’t call it sad, or happy. It’s both.' },
        { who: 'scribe', jp: 'だから なまえも、ひとつの きもちに きめちゃ だめ。「さびしい」でも「こわい」でも ない。', en: 'So its name can’t pin it to one feeling either. Not “lonely”, not “scary”.' },
        { who: 'fude', jp: 'じゃあ、どんな なまえ？', en: 'Then what kind of name?' },
        { who: 'scribe', emote: '…', jp: 'しずかで… やわらかくて… よぶと、そばに いて くれる ような なまえ。「しず…」', en: 'Quiet… and soft… a name that, when you call it, feels like it stays beside you. “Shizu…”' },
        { who: 'scribe', jp: '…ううん、まだ。さいごまで いうのは、とうに ついてから。', en: '…No, not yet. I’ll say all of it when we reach the tower.' },
        { exit: 'elder', bg: 'void', jp: '……', en: '…The memory fades.' },
        { who: 'fude', emote: '!', jp: '「しず…」 ことねは、もう なまえを 見つけて いたんだ。あとは、とうで よぶ だけ…', kana: 'しず… ことねは、もう なまえを みつけて いたんだ。あとは、とうで よぶ だけ…', en: '“Shizu…” Kotone had already found the name. All that was left was to call it, at the tower…' },
      ],
    },
  ],
}
