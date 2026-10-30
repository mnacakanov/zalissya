import { type Npc } from "../data/characters";
import { flagCount, flagHas } from "../systems/flags";

// Dialogue scripts are chosen when a conversation opens, from the world
// state at that moment (herbs gathered, flags, fish) — so a script can
// branch on what the player has done: the Domovyk before and after his
// crust of bread, Radek before and after the bog iron, the Chort before
// and after you sign away your soul.
export function linesFor(npc: Npc, herbs: number, flags: ReadonlySet<string>, fish: number, price = 3, intTotal = 1): string[] {
  switch (npc.id) {
    case "myroslav":
      return [
        "Well now — a new face in Zalissya. I am Myroslav, starosta of this village. You are welcome at our fire.",
        "Mind the forest edge, traveller. The Lisovyk walks among the pines, and he does not love strangers who take without asking.",
        "And be kind to the Domovyk in your hut — leave him bread by the pich, and he will keep your hearth warm through the winter.",
        "You will find him by the north hut most days, fussing over the woodpile. Do not thank him aloud — house spirits hate fuss. There is a crust by the campfire, if you have a mind to leave it for him.",
        "And one thing more, traveller, and hear me well: far off in the north-east hollow sleeps Vij — Вій — the biggest and worst of the old things. His eyelids hang down to the very ground. Look upon him if you must. Do NOT wake him.",
        "Radek at the forge is a guest among us — a Pole from a village many days' road from here. Treat him kindly; a traveller under your roof is a gift.",
        "Two more warnings, and then I will let you be. A Chort has taken to lounging by the old millstone south of the clearing — all bargains and grins. Whatever he offers, traveller, your soul is not spare change. And keep out of the pond reeds: the Bolotianyk has drowned better swimmers than you.",
        "East of here a trail climbs out of the clearing to Lysa Hora — the Bald Mountain, bare as a skull. On sabbath nights the devils and vidmy gather there around a great fire, and the Chort plays host. It is not forbidden ground, traveller — but go polite, go with empty hands for no one, and do not eat what you are offered. Much.",
        "One last thing, and it is the truest thing I know: in Zalissya a person becomes what they do. Gather, and your eye sharpens. Fish, and your hands quicken. Cook, smith, brew — the work makes the worker. Keep an eye on your Character — it is all written there, plain as a tally stick.",
      ];
    case "vesna":
      return herbs >= 5
        ? [
            "Look at your basket — kropyva, polyn, kalendula, zvirobij, derevij! Your eye has grown keen, just as I promised.",
            "Herbalism is not taught, it is gathered — one plant, one walk, one season at a time. You understand now.",
            "Two crafts wait for hands like yours now. At the campfire hangs a pot: one pond fish and one herb from your satchel makes a proper karas soup — that is Cooking, and a fed traveller walks brisker. And by the north-east hut stands my drying rack: two herbs, worked patiently, become a tonic — that is Alchemy. Drink one and the world goes clear for a while.",
            ...(intTotal >= 3
              ? ["And look at you — bright as bottled morning. Your INT has reached 3, so the deep work is open to you now: at my rack you may choose Vesna's strong tonic — three herbs, and drunk it sharpens mind AND eye twice as deep as the common brew (INT +2, WIS +2). Some knowledge only trusts a ready mind, traveller. Yours is ready."]
              : [`One secret I keep for a readier mind: my strong tonic — a deeper draught, three herbs, worth INT +2 and WIS +2 to whoever drinks it. It unlocks at INT 3, and no sooner; a green mind would only waste good polyn. Your INT stands at ${intTotal} today. Keep brewing the common tonic — every batch teaches, and the rack remembers.`]),
            ...(fish > 0
              ? ["And the pond provides too, I see. Your satchel holds the makings of soup already, znak harka that you are becoming."]
              : ["When the herbs rest, try the pond shore, west bank. A patient line catches more than karas — it catches quiet. And quiet is a remedy too."]),
          ]
        : [
            "You have gentle hands. I am Vesna — I tend the sick of Zalissya, and the horod both.",
            "See the glowing patches among the grass? Kropyva the nettle, bitter polyn, kalendula like little suns, zvirobij, and derevij. Gather any of them for me — every herb teaches your eye.",
            "One caution, gentle hands: the yellow zvirobij hides from a green eye. Until your Wisdom reaches 2 it will not let itself be known or gathered — learn the other herbs first, and in time it will open to you.",
            "Bring me five herbs in all, and I will know the forest has accepted you.",
          ];
    case "radek": {
      const iron = flagCount(flags, "iron");
      if (flagHas(flags, "horseshoe")) {
        return [
          "The forge sings again, thanks to your bog iron. Feel that heat? THAT is a kuznya.",
          "That horseshoe I gave you — carry it, and not for luck alone: iron in the pocket puts strength in the arm. You will feel it. That is Smithing's first lesson, and it is free.",
          "The anvil is yours to learn on now, traveller. Stand to it and work the forge — piece by piece, your Smithing grows, and with it your Strength. A strong arm now and then turns out a masterwork. When Vij's day comes, we will be glad of both.",
        ];
      }
      if (iron >= 3) {
        return [
          "What is that weight in your arms — bog iron! Three good lumps, marsh-born and heavy. Traveller, you have just lit my forge.",
          "Here — the first thing off the anvil is yours: a horseshoe, still warm. Carry it for luck. Iron remembers who fed the fire.",
          "Now the kuznya stands ready. When the day comes that Vij stirs, traveller, there will be iron enough in Zalissya. See that you are here for it.",
        ];
      }
      return [
        "Radek. I shoe the horses and mend the ploughs of Zalissya — though I am only a guest here. Mind the anvil — she bites.",
        "My home is a village many days' road from here, far to the west. I came with the spring to lend them my hammer — and the road home can wait until the work is done.",
        ...(iron > 0
          ? [`Bog iron! You found a lump in the pond mud — good eye. ${3 - iron} more like that and this forge roars again.`]
          : ["My kuznya stands cold until I get good iron from the marsh. Bog iron sleeps in the pond mud, traveller — dark lumps that glint where the shore is soft. Three good lumps would light my fire."]),
        "If the Lisovyk troubles you, come to me. Iron has a way of settling arguments with the old things of the wood — in my country, and here too.",
        "And if it is Vij you are asking after — aye, I have heard the tales. Lids so heavy they must be forked up by his servants. They say iron sings against such things. When that day comes, traveller, my forge had better be hot.",
      ];
    }
    case "domovyk":
      if (flagHas(flags, "stone")) {
        return [
          "Hmph. You again. …The bread was good. Crust crisp, salt enough. A hundred winters I have kept this hut, and kindness still surprises the pich out of me.",
          "The stone I left you — keep it by your bed. It will be warm on the coldest night of the year. That is not a promise. That is a Domovyk, and we are better than promises.",
          "Sleep well in Zalissya, little landlord. Your hearth is watched. Your soup is minded. Your mice — polite.",
        ];
      }
      if (flagHas(flags, "offering")) {
        return [
          "…You came back. The crust is gone, did you notice? Behind the pich, nothing but crumbs and a warm smell. I said nothing. House spirits do NOT say thank you.",
          "But check the doorstep of this hut when you leave, new one. Sometimes gratitude… falls out of our pockets. By accident. Mind you do not trip on it.",
        ];
      }
      return [
        "Hush, hush — soft feet by my hut. …Oh. It is the new one. I am Domovyk. I keep this house: the pich warm, the bread risen, the mice polite.",
        "You left no bread yet. Hmm. New ones never do, the first night. Behind the pich, a crust, a little salt — that is all I ask, and I ask it every winter for a hundred years.",
        "There is a crust by the village campfire, if your hands are empty and your heart is not. Bring it to my pich — the north hut, mind — and leave it quiet.",
        "The Lisovyk thinks himself grand out there with his pines. Let him. Empires fall; a warm hearth does not.",
        "…You smell of the north-east path. You have been near Vij. Do not go clattering about up there, little landlord. If those eyelids ever lift, no pich in Zalissya will keep out the cold that follows.",
      ];
    case "lisovyk":
      return [
        "Stop there, two-legs. …You walk softly for one of the hut folk. I am Lisovyk. These pines are mine; the paths through them are mine; the lost are mine also.",
        "Take your herbs — kropyva, polyn, the little suns — the forest gives to hands that ask. But take greedily, and the paths will turn, and turn, and you will greet your own footprints until dark.",
        "Vesna's eye is on you. That is a good eye to be under. Mind it stays so.",
        "You have seen him, then — Vij, in his hollow. Even I walk wide of that place, and I am the forest. Sleep is the only chain that holds him, traveller. See that you never file at it.",
      ];
    case "chort": {
      if (flagHas(flags, "soulback")) {
        return [
          "My favourite customer! Soul returned, gold kept, shadow reattached — you drive a harder bargain than half the sabbath host, and THEY have horns.",
          "No hard feelings, traveller. A deal is a deal. …Though between us? I shall miss your shadow. It danced beautifully.",
          "Speaking of dancing — you should see it dance on Lysa Hora. The Bald Mountain, east trail out of the clearing, bare rock and a great fire. Sabbath nights I host up there: witches, fiddles, Beelzebub himself presiding. Come as my guest. Guests who bring an offering and join the dance leave with more than they came with — that is a promise, not a bargain. Mostly.",
        ];
      }
      if (flagHas(flags, "soulsold")) {
        return [
          "Ahh, my shadowless friend. Notice anything missing at noon? Look down. NOTHING. Beautiful, is it not? The gold, though — the gold is real. Spend it somewhere warm.",
          "And when you tire of the village's little fires — Lysa Hora, traveller. The Bald Mountain, by the east trail. Sabbath nights the whole host dances there, and a guest of mine is a guest of Beelzebub. Shadow or no shadow.",
          ...(fish >= price
            ? [`Hm? What is that smell — pond water and karas? ${price === 2 ? "TWO" : "THREE"} fish, I count, without counting. …You know the price of a soul, traveller. Shall we settle accounts?`]
            : [`If you miss the little thing, I am not unreasonable: ${price} pond fish buys your soul back.${price === 2 ? " Two, not three — that tongue of yours could talk a saint into a sabbath, and I am only a devil." : ""} Devils love fish. Do not ask why. NOBODY knows why.`]),
        ];
      }
      return [
        "Psst. Psst! Over here, by the millstone. …What? A devil can't enjoy a sunny day? I am Chort, traveller — merchant, musician, and modest collector of… signatures.",
        "In the old days we kept a fine sabbath up at the old mill — fiddles, dancing, the whole host! These nights we keep it grander: on Lysa Hora, the Bald Mountain — east trail out of the clearing, bare rock, a fire you can see from Zalissya. And SUCH weddings we used to crash. A Cossack's soul is a vintage thing, my friend. But business is business, and today I am buying.",
        "So — a bargain, just between us. Your soul: slightly used, one careful owner. In exchange? Gold that never runs out. A horse that never tires. Vesna's heart, Radek's hammer, Myroslav's beard — name it! Sign here. And here. And in blood, here — kidding! Ink is fine. Mostly.",
      ];
    }
    case "bolotianyk":
      return [
        "The reeds part. Two eyes rise out of the pond scum, then a head like a drowned log, green-grey and streaming. Bolotianyk looks at you the way deep water looks at a stone.",
        "“Little dry one… my pond. My mud. My bells — the church bells that sank here before your village had a name. I ring them, sometimes, for the ones who waded too far.”",
        "“The znak harka takes my polyn and leaves me be. Wise. You — take your herbs from the grass, dry one. What grows in MY water is not for your basket.”",
        ...(fish > 0
          ? ["“And yet you fish my pond, dry one, and I allow it. Your line is polite. Your shadow… hmm. Your shadow smells of the millstone devil lately. Curious.” Bolotianyk's eyes sink a little, watching."]
          : []),
        "“And tell the hut folk: Bolotianyk is patient. The pond was here before Zalissya. The pond — and what sleeps in the hollow — will be here after. Everything sinks to us, in the end.” The eyes slide back under, and the ripples close like nothing happened.",
      ];
    case "vij":
      return [
        "The hollow is wrong-quiet. No birds. No insects. Only a sound like a mountain breathing — slow, wet, patient.",
        "He is enormous. A head like a boulder, grey as old ash, and eyelids — eyelids that hang from his brow all the way down to the earth, veined and heavy as wet sailcloth. Two withered servants lean on the forks that would lift them. They do not look at you. They look at the lids.",
        "Under one lid, something shifts. A seam of dull red light opens — just a seam — and every hair on your body stands. The servants freeze. The breathing stops.",
        "…The seam closes. The breathing resumes. Whatever Vij dreams of, it is not you. Not yet. You back away very, very quietly, and the birds only start again when the village fire is in sight.",
      ];
    default:
      return ["…"];
  }
}

// Lysa Hora scripts — chosen the same way as village ones, from the state
// of the sabbath chain: nichnyky gathered (counter "lysaFlower"), the
// offering laid ("lysaOffering"), the dance danced ("lysaDanced"), and
// the blessing received ("moonstone").
export function linesForLysa(npc: Npc, flags: ReadonlySet<string>): string[] {
  const flowers = flagCount(flags, "lysaFlower");
  const offered = flagHas(flags, "lysaOffering");
  const danced = flagHas(flags, "lysaDanced");
  const blessed = flagHas(flags, "moonstone");
  switch (npc.id) {
    case "beelzebub":
      if (blessed) {
        return [
          "The great figure on the stone seat inclines his horned head — a small, terrible courtesy. “The mountain remembers its guests, little mortal. The stone at your heart remembers too. Go down warm.”",
          "Below, the witches are still dancing. They will be dancing, one way or another, long after Zalissya is a story grandmothers tell. You walk down the trail with moonlight on your shoulders like a cloak someone lent you — and does not want back yet.",
        ];
      }
      if (danced) {
        return [
          "Beelzebub rises — slowly, the way weather rises. The fiddles falter. Every devil on the summit turns to look at you, and the fire leans in to listen.",
          "“YOU BROUGHT THE MOUNTAIN ITS FLOWERS. YOU DANCED ITS DANCE. THE SABBATH DOES NOT LET SUCH A GUEST GO DOWN EMPTY.” He opens one vast hand. In it, small as a coin and bright as the moon's edge: a moonstone, cold and kind.",
          "“TAKE IT. NOT A BARGAIN — A BLESSING. THERE IS A DIFFERENCE, AND TONIGHT YOU HAVE EARNED THE DIFFERENCE.” Somewhere below the summit, very faintly, a church bell that does not exist rings once — and the Bolotianyk answers it.",
        ];
      }
      if (offered) {
        return [
          "From his seat of black stone, Beelzebub regards you over the fire. His voice is not loud. It does not need to be; the mountain carries it the way it carries thunder.",
          "“THE OFFERING IS LAID. GOOD. NOW — THE DANCE, LITTLE MORTAL. A GUEST WHO ONLY WATCHES IS ONLY HALF A GUEST. STEP INTO THE RING, SOUTH OF THE FIRE, AND KEEP THE TURN.” One clawed hand gestures at the circling witches, almost — almost — kindly.",
        ];
      }
      return [
        "You approach the stone seat at the summit's north edge, and the sabbath goes quiet around you — fiddles trailing off, witches pausing mid-turn, a hundred small devils suddenly very interested in their hooves.",
        "Beelzebub is older than the mountain's baldness and dressed like the best funeral you have ever imagined. “A MORTAL. ON MY MOUNTAIN. WITHOUT AN OFFERING.” He says it the way a starosta notes a missing fence-post: not angry — recording.",
        "“THE RULES ARE OLD, LITTLE MORTAL, AND EVEN I OBEY THEM. NICHNYKY GROW ON THESE SLOPES — NIGHT-BLOOMS, PALE AS BONE. BRING THREE TO THE OFFERING STONE. THEN WE SHALL SEE WHAT YOU ARE.”",
      ];
    case "chort":
      if (blessed) {
        return [
          "You came, you offered, you danced, and Beelzebub HIMSELF blessed you. Do you know what that does to my reputation? NOTHING. It was already magnificent.",
          "Wear the moonstone well, traveller. And if anyone in Zalissya asks where you got it — a devil's guest-price. Let them chew on that.",
        ];
      }
      if (danced) {
        return [
          "You DANCED! Did everyone see? The mortal danced and the mountain did not even crack! Now — up to the big chair with you. Beelzebub has a blessing with your name scratched on it, and he scratches DEEP.",
        ];
      }
      if (offered) {
        return [
          "The offering is laid and the stone is HAPPY — stones are never happy, that is how good it was. Now the dance, traveller! South of the fire, into the ring, keep the turn. Even I cannot waltz a guest's place for them — I checked. Twice. There were… incidents.",
        ];
      }
      if (flowers >= 3) {
        return [
          "Nichnyky! Three pale beauties, and not a petal bruised — you handle night-flowers like a vidma born. The offering stone waits, north of the fire. Lay them down gentle. The mountain notices gentle.",
        ];
      }
      return [
        "MY GUEST ARRIVES! Welcome to Lysa Hora, traveller — the Bald Mountain, my office, my ballroom, my cathedral! Beelzebub presides, the vidmy dance, and the fire — the fire is older than your village and twice as honest.",
        "House rules, and they are Beelzebub's, so they are carved deeper than stone: a guest brings the mountain an offering. Nichnyky — night-blooms — open on these slopes, pale little moons in the rock. Gather three, lay them on the offering stone north of the fire, and the sabbath is yours. Dance with us after, and who knows what blessings fall off the big chair.",
        "And no signatures tonight! Sabbath rules. Even I keep ONE night a week honest. …Mostly.",
      ];
    case "solokha":
      if (blessed) {
        return [
          "Solokha curtseys — a witch's curtsey, which involves more of the sky than seems necessary. “Blessed by the big one himself. Walk down proud, ditko. And if Vesna asks after me — tell her the mountain keeps her sister well.”",
          "She presses nothing into your hand, asks for nothing. From a witch of Lysa Hora, that is the rarest gift of all.",
        ];
      }
      if (danced) {
        return [
          "You dance like a mortal who intends to survive it — clever feet! Up with you to Beelzebub now, before the fire burns lower. A blessing given at high fire is a blessing that keeps.",
        ];
      }
      if (offered) {
        return [
          "The stone took your flowers kindly — I felt it through my shoes. Now dance, ditko. The ring is south of the fire. Do not count the steps; counting is how mortals fall out of the music.",
        ];
      }
      if (flowers >= 3) {
        return [
          "Three nichnyky, and picked at the bloom's first breath — Vesna taught you well, whoever you are. The offering stone, north of the fire. Lay them down and bow to no one; the mountain is not a priest. It is a host.",
        ];
      }
      return [
        "Well — a face from under the roofs! I am Solokha, vidma, widow, and the best cook on this mountain, whatever the devils say with their mouths full. You climb well for a lowlander.",
        "You want the sabbath's welcome? Then do it properly, ditko. Nichnyky — night-blooms — open on the bare slopes, pale as little moons. Three of them on the offering stone, north of the fire. That is the mountain's price, and it is fairer than any devil's.",
        "And afterwards — dance. A guest who will not dance is a guest the mountain forgets. And you do not want to be forgotten by a mountain. It has a long memory and no manners at all.",
      ];
    case "motrya":
      if (blessed) {
        return [
          "Motrya touches two fingers to the moonstone's light and smiles with all her teeth. “It suits you. Moonlight usually does, on the ones the mountain chooses. Come back when it fades, ditko — mountains renew.”",
        ];
      }
      if (danced) {
        return [
          "Motrya is still turning in the ring's echo, humming. “You kept the turn. The big chair noticed. Go and be blessed, dancer — I shall keep your place warm in the circle.”",
        ];
      }
      if (offered) {
        return [
          "Motrya nods at the offering stone, where your nichnyky glow faintly. “Laid true. Now the dance — south of the fire, ditko, and do not think about your feet. Feet hate being thought about.”",
        ];
      }
      return [
        "A small witch with a voice like a nightjar looks up from braiding night-blooms into her hair. “Motrya. I keep the nichnyky of Lysa Hora — which is to say, I know where they hide and I am not too proud to say.”",
        "“The slopes, ditko. Where the rock is baldest and the moonlight pools — that is where they open. Three for the offering stone. Pick them gentle: a night-bloom bruised is a promise bruised, and this mountain counts promises.”",
        ...(flowers > 0 && flowers < 3 ? [`“${flowers} already in your hand, I see — the mountain counts those too. ${3 - flowers} more, ditko.”`] : []),
      ];
    default:
      return ["…"];
  }
}