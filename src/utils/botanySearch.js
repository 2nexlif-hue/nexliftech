import React from 'react';

/**
 * Botanical & Life Sciences Semantic Knowledge Dictionary.
 * Maps biological concepts, genus names, orders, processes, and syllabus keywords
 * to related terms, synonyms, orders, and subtopics.
 */
export const BOTANICAL_SYNONYMS = {
  // Unit 2 - Lower Plants
  'algae': ['cyanophyta', 'chlorophyta', 'chrysophyta', 'dinophyta', 'euglenophyta', 'cryptophyta', 'xanthophyta', 'phaeophyta', 'rhodophyta', 'algal blooms', 'biofertilizers', 'biofuels', 'thallus', 'pyrenoids', 'phycobilins'],
  'alga': ['algae', 'chlorophyta', 'rhodophyta', 'phaeophyta', 'cyanophyta', 'thallus'],
  'bryophytes': ['bryophyta', 'moss', 'mosses', 'liverworts', 'liverwort', 'hornworts', 'hornwort', 'marchantiales', 'metzgeriales', 'jungermanniales', 'anthocerotales', 'sphaerocarpales', 'polytrichales', 'funariales', 'sphagnales', 'alternation of generation'],
  'bryophyta': ['bryophytes', 'moss', 'liverworts', 'hornworts', 'marchantiales', 'metzgeriales', 'jungermanniales', 'anthocerotales', 'sphaerocarpales', 'polytrichales', 'funariales', 'sphagnales'],
  'moss': ['bryophyta', 'bryophytes', 'sphagnales', 'funariales', 'polytrichales', 'sphagnum'],
  'mosses': ['bryophyta', 'bryophytes', 'sphagnales', 'funariales', 'polytrichales', 'sphagnum'],
  'liverwort': ['marchantiales', 'metzgeriales', 'jungermanniales', 'sphaerocarpales', 'marchantia', 'bryophyta'],
  'liverworts': ['marchantiales', 'metzgeriales', 'jungermanniales', 'sphaerocarpales', 'marchantia', 'bryophyta'],
  'hornwort': ['anthocerotales', 'anthoceros', 'bryophyta'],
  'hornworts': ['anthocerotales', 'anthoceros', 'bryophyta'],
  'pteridophytes': ['pteridophyta', 'ferns', 'fern', 'sporangia', 'sporne', 'rhynia', 'trimerophyton', 'lepidodendron', 'sphenophyllum', 'psilotum', 'lycopodium', 'selaginella', 'isoetes', 'equisetum', 'osmunda', 'schizaea', 'pteris', 'ophioglossum', 'marattia', 'dryopteris', 'ceratopteris', 'platyzoma', 'asplenium', 'acrostichum', 'marsilea', 'salvinia', 'stele', 'heterospory'],
  'pteridophyte': ['pteridophytes', 'ferns', 'fern', 'lycopodium', 'selaginella', 'equisetum', 'stele', 'heterospory'],
  'fern': ['pteridophytes', 'pteris', 'dryopteris', 'asplenium', 'osmunda', 'marsilea', 'salvinia', 'stele', 'heterospory'],
  'ferns': ['pteridophytes', 'pteris', 'dryopteris', 'asplenium', 'osmunda', 'marsilea', 'salvinia', 'stele', 'heterospory'],
  'gymnosperms': ['gymnosperm', 'conifers', 'conifer', 'cycas', 'pinus', 'ginkgo', 'ephedra', 'welwitschia', 'gnetum', 'cycadoidia', 'cordaites', 'seed habit', 'naked seed'],
  'gymnosperm': ['gymnosperms', 'conifers', 'cycas', 'pinus', 'ginkgo', 'ephedra', 'welwitschia', 'gnetum'],
  'conifer': ['pinus', 'gymnosperms', 'conifers', 'resin ducts', 'needles'],
  'conifers': ['pinus', 'gymnosperms', 'conifers', 'resin ducts', 'needles'],

  // Unit 1 - Microbiology, Fungi, Plant Pathology
  'virus': ['viruses', 'tmv', 'tobacco mosaic', 'bacteriophage', 'viroids', 'prions', 'capsid', 'envelope', 'lytic', 'lysogenic', 'geminivirus', 'sub-viral'],
  'viruses': ['virus', 'tmv', 'tobacco mosaic', 'bacteriophage', 'viroids', 'prions', 'capsid'],
  'bacteria': ['bacterium', 'archaebacteria', 'eubacteria', 'gram staining', 'plasmids', 'transformation', 'transduction', 'conjugation', 'cyanobacteria', 'nitrogen fixation', 'rhizobium'],
  'fungi': ['fungus', 'mycology', 'alexopoulos', 'myxomycota', 'eumycota', 'mastigomycotina', 'zygomycotina', 'ascomycotina', 'basidiomycotina', 'deuteromycotina', 'heterothallism', 'parasexuality', 'mycorrhizae', 'lichens', 'spores'],
  'fungus': ['fungi', 'mycology', 'alexopoulos', 'mycorrhizae', 'lichens', 'ascomycetes', 'basidiomycetes'],
  'mycology': ['fungi', 'alexopoulos', 'ascomycotina', 'basidiomycotina', 'lichens', 'mycorrhizae'],
  'lichens': ['lichen', 'ascolichens', 'basidiolichens', 'symbiosis', 'mycobiont', 'phycobiont', 'bioindicators', 'pollution'],
  'pathology': ['plant pathology', 'disease', 'diseases', 'rust', 'smut', 'blight', 'powdery mildew', 'damping off', 'kochs postulates', 'phytoalexins', 'pathogenesis'],
  'disease': ['pathology', 'rust', 'smut', 'blight', 'powdery mildew', 'damping off', 'kochs postulates', 'defense mechanisms'],

  // Unit 3 - Plant Taxonomy & Economic Botany
  'taxonomy': ['systematics', 'classification', 'apg', 'apg-iv', 'bentham and hooker', 'engler and prantl', 'hutchinson', 'takhtajan', 'icbn', 'icn', 'phylogeny', 'cladistics', 'herbarium', 'taxa', 'typification', 'valid publication'],
  'angiosperms': ['angiosperm', 'flowering plants', 'apg-iv', 'monocots', 'dicots', 'magnoliaceae', 'ranunculaceae', 'brassicaceae', 'fabaceae', 'rosaceae', 'asteraceae', 'poaceae', 'orchidaceae'],
  'herbarium': ['taxonomy', 'specimen', 'flora', 'taxonomic literature', 'holotype', 'isotype', 'botanical gardens'],
  'economic botany': ['crops', 'cereals', 'pulses', 'spices', 'medicinal plants', 'timber', 'fibres', 'essential oils', 'ethnobotany'],

  // Unit 4 - Anatomy & Embryology
  'anatomy': ['histology', 'xylem', 'phloem', 'cambium', 'secondary growth', 'anomalous secondary growth', 'stomata', 'trichomes', 'meristems', 'stele', 'wood', 'dendrochronology'],
  'embryology': ['microsporogenesis', 'megasporogenesis', 'pollination', 'double fertilization', 'endosperm', 'embryo', 'apomixis', 'polyembryony', 'palynology'],
  'pollen': ['palynology', 'microspore', 'exine', 'intine', 'pollination', 'aeropalynology', 'melissopalynology'],

  // Unit 5 - Plant Physiology & Biochemistry
  'physiology': ['water potential', 'transpiration', 'stomata', 'mineral nutrition', 'phloem transport', 'photosynthesis', 'respiration', 'nitrogen metabolism', 'phytochrome', 'photoperiodism', 'vernalization'],
  'photosynthesis': ['calvin cycle', 'c3', 'c4', 'cam', 'rubisco', 'pep carboxylase', 'photorespiration', 'chloroplast', 'light reactions', 'photophosphorylation', 'z scheme'],
  'respiration': ['glycolysis', 'krebs cycle', 'citric acid cycle', 'ets', 'oxidative phosphorylation', 'atp synthase', 'fermentation', 'respiratory quotient'],
  'hormone': ['hormones', 'plant hormones', 'phytohormones', 'auxin', 'gibberellin', 'cytokinin', 'abscisic acid', 'aba', 'ethylene', 'brassinosteroids', 'jasmonates', 'strigolactones'],
  'hormones': ['hormone', 'auxin', 'gibberellin', 'cytokinin', 'abscisic acid', 'aba', 'ethylene', 'brassinosteroids'],

  // Unit 6 - Genetics & Plant Breeding
  'genetics': ['mendel', 'inheritance', 'linkage', 'crossing over', 'chromosome mapping', 'aneuploidy', 'polyploidy', 'mutations', 'maternal inheritance', 'epistasis', 'sex determination', 'karyotype'],
  'breeding': ['plant breeding', 'hybridization', 'heterosis', 'inbreeding depression', 'selection', 'mutation breeding', 'polyploidy breeding', 'mas', 'marker assisted selection'],
  'mutation': ['mutations', 'mutagenesis', 'point mutation', 'frameshift', 'transition', 'transversion', 'polyploidy'],

  // Unit 7 - Cytology & Molecular Biology
  'molecular': ['molecular biology', 'dna', 'rna', 'replication', 'transcription', 'translation', 'operon', 'lac operon', 'trp operon', 'promoter', 'introns', 'exons', 'crispr', 'cas9'],
  'dna': ['replication', 'transcription', 'genes', 'chromosomes', 'nucleic acids', 'polymerase', 'repair', 'recombination', 'plasmids', 'sequencing'],
  'rna': ['mrna', 'trna', 'rrna', 'transcription', 'ribosomes', 'microrna', 'sirna', 'splicing', 'translation'],
  'cell': ['organelles', 'mitochondria', 'chloroplast', 'plasma membrane', 'cell wall', 'endoplasmic reticulum', 'golgi', 'cell cycle', 'mitosis', 'meiosis', 'apoptosis'],

  // Unit 8 - Biotechnology & Genetic Engineering
  'biotechnology': ['tissue culture', 'recombinant dna', 'cloning vectors', 'pcr', 'restriction enzymes', 'transgenic', 'gmo', 'crispr', 'bioremediation', 'micropropagation', 'somatic embryogenesis'],
  'pcr': ['polymerase chain reaction', 'primers', 'amplification', 'rt-pcr', 'qpcr', 'taq polymerase'],
  'crispr': ['crispr-cas9', 'gene editing', 'guide rna', 'cas9', 'biotechnology', 'genome editing'],

  // Unit 9 - Ecology & Plant Geography
  'ecology': ['ecosystem', 'biomes', 'community ecology', 'succession', 'biodiversity', 'conservation', 'pollution', 'climate change', 'iucn', 'endangered', 'hotspots', 'carbon footprint', 'carbon sequestration'],
  'biodiversity': ['conservation', 'hotspots', 'iucn', 'red data book', 'endemic', 'in situ', 'ex situ', 'biosphere reserve', 'national park'],

  // Unit 10 - Plant Resource Utilization, Biostatistics & Bioinformatics
  'biostatistics': ['statistics', 'mean', 'median', 'mode', 'standard deviation', 'standard error', 'anova', 'chi square', 't test', 'f test', 'correlation', 'regression', 'probability', 'hypothesis testing'],
  'bioinformatics': ['blast', 'fasta', 'ncbi', 'genbank', 'phylogenetic trees', 'pdb', 'sequence alignment', 'docking', 'molecular dynamics', 'uniprot'],
  'microscopy': ['electron microscope', 'tem', 'sem', 'fluorescence microscope', 'confocal', 'light microscopy', 'resolving power', 'numerical aperture'],
  'chromatography': ['hplc', 'gc-ms', 'tlc', 'paper chromatography', 'ion exchange', 'affinity chromatography', 'spectrophotometry']
};

/**
 * Standard Levenshtein distance algorithm for calculating typo distance.
 */
export function levenshteinDistance(a, b) {
  if (a === b) return 0;
  if (!a || !b) return (a || '').length || (b || '').length;

  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Tokenize a text string into normalized words/tokens.
 */
export function tokenize(str) {
  if (!str) return [];
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/[\s,.;:()\\/-]+/)
    .filter(t => t.length > 1);
}

/**
 * Get semantic expansion keywords for a query token.
 */
export function getSemanticExpansions(token) {
  const norm = token.toLowerCase().trim();
  const direct = BOTANICAL_SYNONYMS[norm] || [];
  
  // Also check if token matches start of any key
  const related = [];
  if (norm.length >= 3) {
    for (const [key, synonyms] of Object.entries(BOTANICAL_SYNONYMS)) {
      if (key !== norm && (key.startsWith(norm) || norm.startsWith(key))) {
        related.push(key);
        synonyms.slice(0, 4).forEach(s => related.push(s));
      }
    }
  }

  return Array.from(new Set([...direct, ...related]));
}

/**
 * Check if a word fuzzy-matches a query token.
 * Handles:
 * 1. Substring/Prefix: 'sphae' matches 'Sphaerocarpales', 'Sphagnales'
 * 2. Typo tolerance: Levenshtein distance <= 1 for len 4-6, <= 2 for len >= 7
 */
export function wordFuzzyMatch(queryToken, targetWord) {
  const q = queryToken.toLowerCase();
  const t = targetWord.toLowerCase();

  // Exact or prefix or substring match
  if (t === q || t.startsWith(q) || t.includes(q)) {
    return { isMatch: true, exact: t.startsWith(q) || t === q, score: 10 };
  }

  // Typo tolerance
  if (q.length >= 4 && t.length >= 4) {
    const maxDist = q.length >= 7 ? 2 : 1;
    const dist = levenshteinDistance(q, t);
    if (dist <= maxDist) {
      return { isMatch: true, exact: false, score: 7 - dist };
    }
  }

  return { isMatch: false, exact: false, score: 0 };
}

/**
 * Evaluate text against a search query with fuzzy and semantic intelligence.
 * Returns:
 * {
 *   isMatch: boolean,
 *   score: number,
 *   matchedTerms: Set<string>, // Words/stems in text that matched
 *   semanticMatches: Array<string>
 * }
 */
export function evaluateTextMatch(text, query) {
  if (!text || !query) return { isMatch: false, score: 0, matchedTerms: new Set(), semanticMatches: [] };

  const queryClean = query.trim().toLowerCase();
  const queryTokens = tokenize(queryClean);
  if (queryTokens.length === 0) return { isMatch: false, score: 0, matchedTerms: new Set(), semanticMatches: [] };

  const textLower = text.toLowerCase();
  const textWords = text.match(/\b[\w'-]+\b/g) || [];

  const matchedTerms = new Set();
  const semanticMatches = [];
  let totalScore = 0;

  // Direct phrase match check
  if (textLower.includes(queryClean)) {
    totalScore += 25;
    matchedTerms.add(queryClean);
  }

  // Token-by-token matching
  for (const qToken of queryTokens) {
    let tokenMatched = false;

    // Check against every word in text
    for (const word of textWords) {
      const match = wordFuzzyMatch(qToken, word);
      if (match.isMatch) {
        tokenMatched = true;
        totalScore += match.score;
        matchedTerms.add(word.toLowerCase());
      }
    }

    // Check semantic synonyms
    const synonyms = getSemanticExpansions(qToken);
    for (const syn of synonyms) {
      if (textLower.includes(syn)) {
        totalScore += 8;
        semanticMatches.push(syn);
        matchedTerms.add(syn);
        tokenMatched = true;
      }
    }

    if (tokenMatched) {
      totalScore += 5;
    }
  }

  return {
    isMatch: totalScore > 0,
    score: totalScore,
    matchedTerms,
    semanticMatches: Array.from(new Set(semanticMatches))
  };
}

/**
 * Filter and rank syllabus units based on query.
 * Returns array of { unit, score, matchedUnit, matchedSubunitCount, matchedTerms }
 */
export function searchSyllabusAdvanced(syllabus, query) {
  if (!query || !query.trim()) {
    return {
      results: syllabus.map(u => ({
        ...u,
        matched: false,
        subunits: u.subunits || [],
        matchCount: 0,
        matchedTerms: []
      })),
      matchingUnitIds: new Set(),
      totalMatches: 0
    };
  }

  const queryClean = query.trim();
  const matchingUnitIds = new Set();
  let totalMatches = 0;

  const scoredUnits = [];

  for (const unit of syllabus) {
    let unitScore = 0;
    const allUnitMatchedTerms = new Set();

    // Check Unit Title
    const titleMatch = evaluateTextMatch(unit.title, queryClean);
    if (titleMatch.isMatch) {
      unitScore += titleMatch.score * 2.5;
      titleMatch.matchedTerms.forEach(t => allUnitMatchedTerms.add(t));
    }

    // Check Unit Short Title
    if (unit.shortTitle) {
      const shortMatch = evaluateTextMatch(unit.shortTitle, queryClean);
      if (shortMatch.isMatch) {
        unitScore += shortMatch.score * 2;
        shortMatch.matchedTerms.forEach(t => allUnitMatchedTerms.add(t));
      }
    }

    // Check Unit Number (e.g., 'u2', 'unit 2', '2')
    const qNorm = queryClean.replace(/\s+/g, '');
    if (qNorm === `u${unit.unitNumber}` || qNorm === `unit${unit.unitNumber}` || qNorm === `${unit.unitNumber}`) {
      unitScore += 50;
      allUnitMatchedTerms.add(`unit ${unit.unitNumber}`);
    }

    // Check Subunits
    const subunitMatches = [];
    let matchedSubunitCount = 0;

    for (const sub of (unit.subunits || [])) {
      const subTitleMatch = evaluateTextMatch(sub.title, queryClean);
      const subDescMatch = evaluateTextMatch(sub.description, queryClean);

      const isSubMatch = subTitleMatch.isMatch || subDescMatch.isMatch;
      const subScore = (subTitleMatch.score * 2) + subDescMatch.score;

      const subMatchedTerms = new Set();
      subTitleMatch.matchedTerms.forEach(t => {
        subMatchedTerms.add(t);
        allUnitMatchedTerms.add(t);
      });
      subDescMatch.matchedTerms.forEach(t => {
        subMatchedTerms.add(t);
        allUnitMatchedTerms.add(t);
      });

      if (isSubMatch) {
        matchedSubunitCount++;
        unitScore += subScore;
        totalMatches++;
      }

      subunitMatches.push({
        ...sub,
        isMatched: isSubMatch,
        score: subScore,
        matchedTerms: Array.from(subMatchedTerms),
        semanticMatches: Array.from(new Set([...subTitleMatch.semanticMatches, ...subDescMatch.semanticMatches]))
      });
    }

    if (unitScore > 0) {
      matchingUnitIds.add(unit.unitId);
      scoredUnits.push({
        ...unit,
        matched: true,
        score: unitScore,
        matchCount: matchedSubunitCount + (titleMatch.isMatch ? 1 : 0),
        matchedSubunitCount,
        matchedTerms: Array.from(allUnitMatchedTerms),
        subunits: subunitMatches
      });
    }
  }

  // Sort matched units by score descending
  scoredUnits.sort((a, b) => b.score - a.score);

  return {
    results: scoredUnits,
    matchingUnitIds,
    totalMatches
  };
}

/**
 * Escapes regex special characters.
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Highlight matching tokens and matched terms in a given text.
 * Generates safely highlighted React elements with `<mark className="botany-search-highlight">`.
 */
export function HighlightMatch({ text, query, matchedTerms = [] }) {
  if (!text) return null;
  if (!query && (!matchedTerms || matchedTerms.length === 0)) {
    return React.createElement('span', null, text);
  }

  // Collect all terms to search and highlight
  const rawTerms = [];

  if (query && query.trim()) {
    const qClean = query.trim();
    // Add raw query phrase if multi-word
    if (qClean.includes(' ')) {
      rawTerms.push(qClean);
    }
    // Add individual tokens (length >= 2)
    tokenize(qClean).forEach(t => {
      if (t.length >= 2) rawTerms.push(t);
    });
  }

  if (Array.isArray(matchedTerms)) {
    matchedTerms.forEach(term => {
      if (term && term.length >= 2) rawTerms.push(term);
    });
  }

  // Filter and sort terms by length descending so longer words match first
  const uniqueTerms = Array.from(new Set(rawTerms.map(t => t.toLowerCase())))
    .filter(t => t.length >= 2)
    .sort((a, b) => b.length - a.length);

  if (uniqueTerms.length === 0) {
    return React.createElement('span', null, text);
  }

  // Build a combined regex with alternation
  // We match word prefixes or boundary occurrences where possible
  const pattern = uniqueTerms.map(escapeRegex).join('|');
  const regex = new RegExp(`(${pattern})`, 'gi');

  const parts = text.split(regex);
  if (parts.length === 1) {
    return React.createElement('span', null, text);
  }

  return React.createElement(
    'span',
    null,
    parts.map((part, i) => {
      const isMatch = uniqueTerms.some(term => term.toLowerCase() === part.toLowerCase());
      if (isMatch) {
        return React.createElement(
          'mark',
          { key: i, className: 'botany-search-highlight' },
          part
        );
      }
      return React.createElement('span', { key: i }, part);
    })
  );
}

