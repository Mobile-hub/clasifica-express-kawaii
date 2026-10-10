// Word bank (Spanish, for 8–12 year olds) and word tiers.
// Each entry is written split by syllable with hyphens. A leading * marks words whose spelling with or without
// a tilde is another valid word (papá/papa, saltó/salto): they are never used in the Tildes mode.
// Tiers are computed from the shape of the word, never assigned by hand (see tierOf).
// Works in the browser (window.CE.words) and in node (module.exports) for tests.
(function (root) {
  const S = typeof module !== 'undefined' && module.exports ? require('./syllables.js') : root.CE.syllables;

  const BANK = {
    animales: `
      ga-to *pe-rro va-ca ca-ba-llo o-ve-ja ca-bra cer-do co-ne-jo ra-tón pa-to ga-lli-na ga-llo po-llo bú-ho
      á-gui-la pa-lo-ma go-rrión pá-ja-ro pin-güi-no del-fín ba-lle-na ti-bu-rón pul-po can-gre-jo tor-tu-ga ra-na
      sa-po ser-pien-te co-co-dri-lo lo-ro ca-ma-le-ón le-ón ti-gre e-le-fan-te ji-ra-fa ce-bra mo-no o-so lo-bo
      zo-rro ar-di-lla e-ri-zo ma-ri-po-sa a-be-ja hor-mi-ga a-ra-ña mos-ca mos-qui-to ca-ra-col gu-sa-no
      sal-ta-mon-tes li-bé-lu-la mur-cié-la-go hi-po-pó-ta-mo ri-no-ce-ron-te can-gu-ro pan-da ca-me-llo
      dro-me-da-rio ja-ba-lí co-li-brí ca-na-rio pa-vo ci-güe-ña fla-men-co gar-za pe-lí-ca-no ga-vio-ta fo-ca
      mor-sa nu-tria cas-tor ta-pir pu-ma ja-guar o-ru-ga ciem-piés lom-briz per-diz co-dor-niz a-ves-truz
      cer-ní-ca-lo lu-ciér-na-ga es-ca-ra-ba-jo sar-di-na a-tún sal-món tru-cha me-du-sa la-gar-ti-ja ca-ma-rón
      lan-gos-ta al-me-ja os-tra ba-ca-la-o cuer-vo rui-se-ñor hal-cón bui-tre o-ca gan-so cis-ne ví-bo-ra
      pe-ri-qui-to ca-ba-lli-to pe-rri-to ga-ti-to mi-ni-no ma-mut di-no-sau-rio  bú-fa-lo
      chim-pan-cé go-ri-la  
    `,
    comida: `
      le-che a-gua ja-món que-so hue-vo a-rroz pas-ta so-pa to-ma-te le-chu-ga za-na-ho-ria pa-ta-ta ce-bo-lla
      a-jo pi-mien-to pe-pi-no ca-la-ba-cín be-ren-je-na gui-san-te len-te-ja gar-ban-zo ju-dí-a ma-íz plá-ta-no
      man-za-na pe-ra na-ran-ja li-món fre-sa u-va me-lón san-dí-a pi-ña ce-re-za me-lo-co-tón co-co li-ma mo-ra
      fram-bue-sa a-rán-da-no hi-go dá-til nís-pe-ro al-ba-ri-co-que ci-rue-la man-da-ri-na ga-lle-ta pas-tel
      tar-ta ca-ra-me-lo cho-co-la-te he-la-do mag-da-le-na chu-rro ros-qui-lla bo-ca-di-llo ham-bur-gue-sa
      sal-chi-cha tor-ti-lla pa-e-lla cro-que-ta al-bón-di-ga fi-de-os ma-ca-rro-nes es-pa-gue-ti ce-re-al yo-gur
      man-te-qui-lla mer-me-la-da a-zú-car a-cei-te vi-na-gre pi-mien-ta sal-sa ma-yo-ne-sa pu-ré ca-fé zu-mo
      ba-ti-do re-fres-co em-pa-na-da biz-co-cho ma-za-pán tu-rrón pol-vo-rón al-mí-bar ca-ca-o a-ce-tu-na
      al-men-dra a-ve-lla-na ca-ca-hue-te es-pi-na-cas a-cel-gas bró-co-li co-li-flor cham-pi-ñón ca-la-ba-za
      pue-rro rá-ba-no a-pio ma-ní pis-ta-cho pa-lo-mi-tas me-rien-da *de-sa-yu-no co-mi-da ce-na al-muer-zo
      bom-bón go-lo-si-na pi-ru-le-ta na-ta 
    `,
    casa: `
      ca-sa me-sa si-lla so-fá ca-ma puer-ta ven-ta-na te-cho sue-lo pa-red es-ca-le-ra co-ci-na *ba-ño sa-lón
      dor-mi-to-rio pa-si-llo jar-dín te-rra-za bal-cón ga-ra-je lám-pa-ra es-pe-jo al-fom-bra cor-ti-na ar-ma-rio
      ca-jón es-tan-te-rí-a al-mo-ha-da *sá-ba-na man-ta to-a-lla ja-bón cham-pú ce-pi-llo *pei-ne gri-fo du-cha
      ba-ñe-ra ne-ve-ra hor-no fre-ga-de-ro pla-to va-so ta-za cu-cha-ra te-ne-dor cu-chi-llo sar-tén o-lla
      ca-ce-ro-la te-le-vi-sión te-lé-fo-no or-de-na-dor re-loj ra-dio lla-ve tim-bre bu-zón chi-me-ne-a
      só-ta-no á-ti-co ma-ce-ta flo-re-ro cua-dro co-jín per-cha es-co-ba fre-go-na re-co-ge-dor cu-bo ba-su-ra
      plan-cha la-va-do-ra e-di-fi-cio *pi-so ca-ba-ña cas-ti-llo pa-la-cio ba-rrio ciu-dad pue-blo ca-lle pla-za
      par-que fa-ro-la se-má-fo-ro a-ce-ra puen-te tú-nel fuen-te ban-co mu-se-o bi-blio-te-ca hos-pi-tal
      far-ma-cia mer-ca-do co-le-gio ci-ne te-a-tro es-ta-dio pis-ci-na a-e-ro-puer-to es-ta-ción i-gle-sia
      pa-na-de-rí-a fru-te-rí-a pe-lu-que-rí-a ju-gue-te-rí-a li-bre-rí-a ven-ta-ni-lla ál-bum
    `,
    escuela: `
      lá-piz go-ma re-gla li-bro cua-der-no mo-chi-la es-tu-che pi-za-rra ti-za pu-pi-tre cla-se pro-fe-sor
      pro-fe-so-ra a-lum-no a-lum-na re-cre-o pa-tio e-xa-men e-xá-me-nes no-ta de-be-res ma-te-má-ti-cas
      mú-si-ca len-gua cien-cias dic-cio-na-rio ti-je-ras pe-ga-men-to ro-tu-la-dor bo-lí-gra-fo sa-ca-pun-tas
      com-pás car-pe-ta fo-lio pa-pel car-tu-li-na glo-bo ma-pa *nú-me-ro le-tra sí-la-ba pa-la-bra fra-se cuen-to
      po-e-sí-a his-to-ria ar-te *di-bu-jo pin-tu-ra pin-cel a-cua-re-la plas-ti-li-na cal-cu-la-do-ra á-ba-co
      su-ma res-ta di-vi-sión mul-ti-pli-ca-ción frac-ción á-re-a án-gu-lo trián-gu-lo *cír-cu-lo cua-dra-do
      rec-tán-gu-lo ex-cur-sión re-dac-ción lec-ción pre-gun-ta res-pues-ta e-jer-ci-cio gim-na-sio de-por-te
      ba-lón pe-lo-ta por-te-rí-a ca-nas-ta ra-que-ta *e-qui-po com-pa-ñe-ro a-mi-go a-mi-ga *pá-gi-na *diá-lo-go cuén-ta-me
      bi-blio-te-ca-rio ex-pli-ca-ción ca-li-fi-ca-ción a-gen-da e-ti-que-ta
    `,
    cuerpo: `
      ca-be-za *pe-lo o-jo o-re-ja na-riz bo-ca dien-te la-bio cue-llo hom-bro bra-zo co-do ma-no de-do u-ña
      pe-cho es-pal-da ba-rri-ga om-bli-go pier-na ro-di-lla to-bi-llo ta-lón co-ra-zón pul-món es-tó-ma-go
      hue-so mús-cu-lo san-gre ce-re-bro me-ji-lla fren-te ce-ja pes-ta-ña bar-bi-lla mu-ñe-ca cin-tu-ra ca-de-ra
      es-que-le-to crá-ne-o cos-ti-lla pár-pa-do mus-lo pul-gar ín-di-ce co-lum-na ca-ra
    `,
    ropa: `
      ca-mi-sa ca-mi-se-ta pan-ta-lón fal-da ves-ti-do za-pa-to za-pa-ti-lla cal-ce-tín *a-bri-go cha-que-ta
      jer-sey bu-fan-da guan-tes go-rro som-bre-ro go-rra pi-ja-ma ba-ña-dor bo-ta san-da-lia cin-tu-rón
      cor-ba-ta bol-si-llo bo-tón cre-ma-lle-ra ga-fas pa-ra-guas a-ni-llo co-llar pul-se-ra pen-dien-te bol-so
      ma-le-ta dis-fraz ca-pu-cha an-ti-faz cha-le-co ca-pa co-ro-na
    `,
    naturaleza: `
      lu-na es-tre-lla cie-lo nu-be llu-via nie-ve vien-to *rí-o o-la pla-ya a-re-na ro-ca pie-dra mon-ta-ña
      vol-cán is-la la-go bos-que sel-va de-sier-to ár-bol ho-ja ra-ma ra-íz mar-ga-ri-ta gi-ra-sol tu-li-pán
      cés-ped hier-ba se-mi-lla fru-to tie-rra ar-co-í-ris true-no ra-yo re-lám-pa-go tor-men-ta hu-ra-cán
      pla-ne-ta co-me-ta as-te-roi-de ga-la-xia u-ni-ver-so ma-ña-na tar-de no-che dí-a in-vier-no ve-ra-no
      o-to-ño pri-ma-ve-ra nie-bla ro-cí-o es-car-cha gra-ni-zo hie-lo ca-lor *frí-o o-cé-a-no cas-ca-da cue-va
      co-li-na va-lle pra-de-ra *ca-mi-no sen-de-ro mus-go he-le-cho pi-no ro-ble pal-me-ra cac-tus bam-bú e-co
      pla-ta o-ro dia-man-te per-la cris-tal i-mán a-tar-de-cer a-ma-ne-cer brú-ju-la ter-mó-me-tro a-ma-po-la
      tré-bol ma-ri-na *lí-ne-a diá-me-tro
    `,
    transporte: `
      co-che mo-to au-to-bús a-vión bar-co bi-ci-cle-ta ca-mión me-tro tran-ví-a ta-xi he-li-cóp-te-ro co-he-te
      sub-ma-ri-no ca-no-a ve-le-ro pa-ti-ne-te pa-ti-nes mo-no-pa-tín trac-tor am-bu-lan-cia ca-rre-te-ra
      vo-lan-te rue-da mo-tor *pi-lo-to con-duc-tor ga-so-li-na fur-go-ne-ta grú-a ex-ca-va-do-ra pa-ra-ca-í-das
      fe-rro-ca-rril lan-cha ya-te ve-hí-cu-lo ma-le-te-ro bi-lle-te *via-je via-je-ro a-vio-ne-ta *náu-fra-go tri-ci-clo
    `,
    personas: `
      *mé-di-co *mé-di-ca en-fer-me-ro po-li-cí-a bom-be-ro co-ci-ne-ro pa-na-de-ro car-te-ro ma-es-tro pin-tor
      mú-si-co dan-za-rín as-tro-nau-ta ve-te-ri-na-rio den-tis-ta gran-je-ro pes-ca-dor a-gri-cul-tor
      ar-qui-tec-to in-ge-nie-ro a-bo-ga-do ac-tor ac-triz can-tan-te es-cri-tor fo-tó-gra-fo pe-rio-dis-ta
      me-cá-ni-co e-lec-tri-cis-ta fon-ta-ne-ro car-pin-te-ro al-ba-ñil jar-di-ne-ro pe-lu-que-ro pa-ya-so ma-go
      cien-tí-fi-co in-ves-ti-ga-dor pi-ra-ta rei-na prín-ci-pe prin-ce-sa ca-ba-lle-ro dra-gón bru-ja ha-da
      gi-gan-te duen-de si-re-na fan-tas-ma mons-truo ro-bot *ma-má *pa-pá a-bue-lo a-bue-la her-ma-no her-ma-na
      pri-mo pri-ma tí-o tí-a *be-bé ve-ci-no ve-ci-na jo-ven jó-ve-nes ni-ño ni-ña fa-mi-lia
    `,
    adjetivos: `
      gran-de pe-que-ño al-to *ba-jo gor-do fla-co rá-pi-do len-to fá-cil di-fí-cil ú-til á-gil dé-bil fuer-te
      a-le-gre tris-te fe-liz a-ma-ble sim-pá-ti-co có-mi-co tí-mi-do va-lien-te cu-rio-so lis-to bo-ni-to fe-o
      *lim-pio su-cio nue-vo vie-jo du-ro blan-do sua-ve ca-lien-te tem-pla-do dul-ce sa-la-do á-ci-do a-mar-go
      ro-jo a-zul ver-de a-ma-ri-llo mo-ra-do ma-rrón ne-gro blan-co do-ra-do pla-te-a-do lu-mi-no-so os-cu-ro
      cla-ro bri-llan-te fan-tás-ti-co má-gi-co en-can-ta-dor fe-roz ve-loz ca-paz in-fe-liz le-al i-de-al
      gra-cio-so ge-ne-ro-so pe-re-zo-so tra-ba-ja-dor ha-bla-dor dor-mi-lón glo-tón co-mi-lón chi-qui-tín
      re-gor-de-te es-pon-jo-so a-pe-ti-to-so de-li-cio-so ma-ra-vi-llo-so e-nor-me di-mi-nu-to tí-pi-co
      *úl-ti-mo pri-me-ro se-gun-do ter-ce-ro cuar-to quin-to pró-xi-mo ú-ni-co *lí-qui-do só-li-do hú-me-do
      es-plén-di-do *mag-ní-fi-co pá-li-do cá-li-do *ví-de-o 
    `,
    numeros: `
      u-no cua-tro cin-co sie-te o-cho nue-ve on-ce do-ce tre-ce ca-tor-ce quin-ce die-ci-séis vein-te trein-ta
      cua-ren-ta cin-cuen-ta se-sen-ta se-ten-ta o-chen-ta no-ven-ta mi-llón vein-ti-trés vein-ti-dós
      die-ci-nue-ve vein-tiún
    `,
    tiempo: `
      lu-nes mar-tes miér-co-les jue-ves vier-nes sá-ba-do do-min-go e-ne-ro fe-bre-ro mar-zo a-bril ma-yo ju-nio
      ju-lio a-gos-to sep-tiem-bre oc-tu-bre no-viem-bre di-ciem-bre cum-ple-a-ños fies-ta *re-ga-lo ve-la
      pi-ña-ta con-fe-ti se-ma-na re-cuer-do
    `,
    juegos: `
      ju-gue-te pe-lu-che ca-ni-ca pe-on-za rom-pe-ca-be-zas a-je-drez da-do car-ta co-lum-pio to-bo-gán
      a-re-ne-ro ba-lan-cín tram-po-lín ma-rio-ne-ta tí-te-re tam-bor flau-ta gui-ta-rra pia-no vio-lín
      trom-pe-ta xi-ló-fo-no ar-pa ma-ra-cas can-ción can-cio-nes rit-mo con-cier-to or-ques-ta dis-co
      mi-cró-fo-no cá-ma-ra pe-lí-cu-la fút-bol béis-bol ba-lon-ces-to te-nis ci-clis-mo na-ta-ción at-le-tis-mo
      gim-na-sia pa-ti-na-je es-quí *ár-bi-tro por-te-ro de-lan-te-ro cam-pe-ón me-da-lla tro-fe-o pe-nal-ti
      es-con-di-te
    `,
    acciones: `
      can-tar bai-lar sal-tar co-rrer ju-gar co-mer be-ber dor-mir le-er es-cri-bir pin-tar di-bu-jar na-dar
      vo-lar sa-ber pen-sar re-ga-lar pre-gun-tar con-tes-tar es-cu-char mi-rar ha-blar a-pren-der en-se-ñar
      lim-piar co-ci-nar via-jar cons-truir pa-se-ar re-ír son-re-ír o-ír *can-tó *bai-ló *sal-tó co-rrió *ju-gó
      co-mí be-bí dor-mí es-cri-bí *na-dé vo-ló *ga-nó *lle-gó a-pren-dí *ter-mi-né *es-tu-dió le-í ca-í
      o-í-mos son-rí-o ac-tú-a *con-ti-nú-a ha-bí-a *te-ní-a vi-ví-a que-rí-a ten-drá *es-tá sa-brás ven-drás
      vol-ve-rán can-ta-rás ja-más a-de-más tam-bién qui-zás a-trás des-pués a-quí a-llí a-hí a-llá a-cá a-sí
      ru-bí *do-mi-nó ta-bú *pa-só *mi-ró *pa-gó *ca-yó
      le-jos cer-ca a-yer nun-ca siem-pre to-da-ví-a pro-hí-be re-ú-ne ma-dru-gar
    `,
  };

  // Easter egg only: sobresdrújulas (never mixed into the normal decks).
  const EASTER = `
    dí-ga-me-lo cuén-ta-me-lo cóm-pra-se-lo llé-va-te-lo prés-ta-me-lo es-crí-be-se-lo ex-plí-ca-se-lo
    trá-e-me-lo guár-da-me-lo en-sé-ña-se-lo di-bú-ja-me-lo re-gá-la-se-lo
  `;

  // Hand-checked syllabifications the automatic syllabifier gets wrong (keep this list short and commented).
  const SYLLABIFIER_EXCEPTIONS = {
  };

  function parseList(text) {
    return text.split(/\s+/).filter(Boolean).map((raw) => {
      const ambiguous = raw.startsWith('*');
      const entry = ambiguous ? raw.slice(1) : raw;
      return Object.assign(S.parse(entry), { entry, ambiguous });
    });
  }

  function syllableUnits(syllable) {
    return S.tokenize(syllable);
  }

  // A syllable is "simple" when it is at most one consonant sound followed by one vowel: ca, ma, lla, que, a.
  function isSimpleSyllable(syllable) {
    const u = syllableUnits(syllable);
    const vowels = u.filter((x) => x.t === 'V');
    if (vowels.length !== 1 || u[u.length - 1].t !== 'V') return false;
    return u.length <= 2;
  }

  function hasVowelGroup(w) {
    if (w.syllables.some((s) => syllableUnits(s).filter((x) => x.t === 'V').length > 1)) return true;
    // Unstressed hiatus between syllables (po-e-ta, le-ón): one syllable ends in a vowel and the next starts with one.
    for (let i = 0; i + 1 < w.syllables.length; i++) {
      const a = w.syllables[i];
      const b = w.syllables[i + 1];
      if (S.tokenize(a).slice(-1)[0].t === 'V' && S.tokenize(b)[0].t === 'V') return true;
    }
    return false;
  }

  // 1: short words of simple syllables · 2: up to 3 syllables with clusters or closed syllables ·
  // 3: diphthongs, triphthongs and plain hiatus · 4: four or more syllables · 5: hiatus that takes a tilde.
  function tierOf(w) {
    if (S.hasHiatusTilde(w.word)) return 5;
    if (w.syllables.length >= 4) return 4;
    if (hasVowelGroup(w)) return 3;
    if (w.syllables.every(isSimpleSyllable)) return 1;
    return 2;
  }

  const ALL = [];
  for (const theme of Object.keys(BANK)) {
    for (const w of parseList(BANK[theme])) ALL.push(Object.assign(w, { theme, tier: tierOf(w) }));
  }
  const EGGS = parseList(EASTER).map((w) => Object.assign(w, { theme: 'easter', tier: 5, egg: true }));

  function byTier(tier) {
    return ALL.filter((w) => w.tier === tier);
  }

  const api = { BANK, ALL, EGGS, SYLLABIFIER_EXCEPTIONS, parseList, isSimpleSyllable, tierOf, byTier };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.CE = root.CE || {}).words = api;
})(typeof window !== 'undefined' ? window : globalThis);
