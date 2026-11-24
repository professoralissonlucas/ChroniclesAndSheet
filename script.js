(() => {
const STORAGE_KEY = 'chronicles-sheet-state-v1';
const appStatus = document.getElementById('appStatus');
const VERSAO_ATUAL_DADOS = 5;
const RELATIONSHIP_BOND_TYPES = ['common', 'romantic'];
const PIXEL_ART_SIZES = new Set([16, 32, 64]);
const PIXEL_ART_HISTORY_LIMIT = 40;
const PIXEL_ART_PALETTE = [
  { name: 'Preto', color: '#1d1714' },
  { name: 'Branco', color: '#fff8e8' },
  { name: 'Cinza', color: '#8e8b88' },
  { name: 'Vermelho', color: '#c84242' },
  { name: 'Laranja', color: '#e78235' },
  { name: 'Amarelo', color: '#f0ce52' },
  { name: 'Verde', color: '#578c50' },
  { name: 'Azul', color: '#4d79b8' },
  { name: 'Roxo', color: '#8759a7' },
  { name: 'Rosa', color: '#d887a4' },
  { name: 'Marrom', color: '#70452e' },
  { name: 'Pele clara', color: '#f3d0ad' },
  { name: 'Pele média', color: '#c98e62' },
  { name: 'Pele escura', color: '#805239' },
];
const SKILL_COLLATOR = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });
const DEFAULT_ATTRIBUTES = [
  { id: 'attribute-forca', legacyKey: 'forca', name: 'Força' },
  { id: 'attribute-inteligencia', legacyKey: 'inteligencia', name: 'Intelecto' },
  { id: 'attribute-carisma', legacyKey: 'carisma', name: 'Presença' },
  { id: 'attribute-destreza', legacyKey: 'destreza', name: 'Agilidade' },
  { id: 'attribute-constituicao', legacyKey: 'constituicao', name: 'Vigor' },
];
const ATRIBUTOS_LEGADOS = [
  { id: 'attribute-forca', oldName: 'Força', name: 'Força', key: 'forca' },
  { id: 'attribute-inteligencia', oldName: 'Inteligência', name: 'Intelecto', key: 'inteligencia' },
  { id: 'attribute-carisma', oldName: 'Carisma', name: 'Presença', key: 'carisma' },
  { id: 'attribute-destreza', oldName: 'Destreza', name: 'Agilidade', key: 'destreza' },
  { id: 'attribute-constituicao', oldName: 'Constituição', name: 'Vigor', key: 'constituicao' },
  { id: 'attribute-sabedoria', oldName: 'Sabedoria', name: '', key: 'sabedoria' },
];
const DEFAULT_SKILLS = [
  { id: 'skill-acrobacia', name: 'Acrobacia', attributes: ['Agilidade'] },
  { id: 'skill-adestramento', name: 'Adestramento', attributes: ['Presença'] },
  { id: 'skill-artes', name: 'Artes', attributes: ['Intelecto', 'Presença'] },
  { id: 'skill-atletismo', name: 'Atletismo', attributes: ['Força', 'Agilidade'] },
  { id: 'skill-atualidades', name: 'Atualidades', attributes: ['Intelecto'] },
  { id: 'skill-ciencias', name: 'Ciências', attributes: ['Intelecto'] },
  { id: 'skill-crime', name: 'Crime', attributes: ['Agilidade', 'Intelecto'] },
  { id: 'skill-diplomacia', name: 'Diplomacia', attributes: ['Presença'] },
  { id: 'skill-enganacao', name: 'Enganação', attributes: ['Presença', 'Intelecto'] },
  { id: 'skill-fortitude', name: 'Fortitude', attributes: ['Vigor'] },
  { id: 'skill-furtividade', name: 'Furtividade', attributes: ['Agilidade'] },
  { id: 'skill-iniciativa', name: 'Iniciativa', attributes: ['Agilidade'] },
  { id: 'skill-intimidacao', name: 'Intimidação', attributes: ['Presença'] },
  { id: 'skill-intuicao', name: 'Intuição', attributes: ['Presença'] },
  { id: 'skill-investigacao', name: 'Investigação', attributes: ['Intelecto'] },
  { id: 'skill-luta', name: 'Luta', attributes: ['Força'] },
  { id: 'skill-magia-divina', name: 'Magia Divina', attributes: ['Vigor'] },
  { id: 'skill-medicina', name: 'Medicina', attributes: ['Intelecto'] },
  { id: 'skill-mitologia', name: 'Mitologia', attributes: ['Intelecto'] },
  { id: 'skill-percepcao', name: 'Percepção', attributes: ['Presença'] },
  { id: 'skill-pilotagem', name: 'Pilotagem', attributes: ['Agilidade', 'Intelecto'] },
  { id: 'skill-pontaria', name: 'Pontaria', attributes: ['Agilidade'] },
  { id: 'skill-reflexos', name: 'Reflexos', attributes: ['Agilidade'] },
  { id: 'skill-religiao', name: 'Religião', attributes: ['Intelecto'] },
  { id: 'skill-sobrevivencia', name: 'Sobrevivência', attributes: ['Intelecto', 'Vigor'] },
  { id: 'skill-tecnologia', name: 'Tecnologia', attributes: ['Intelecto'] },
  { id: 'skill-vontade', name: 'Vontade', attributes: ['Presença'] },
];
const REMOVED_SKILL_NAMES = new Set(['Tática', 'Ocultismo', 'Profissão'].map(normalizarNome));

function createDefaultAttributes(values = {}) {
  return DEFAULT_ATTRIBUTES.map((attribute) => ({
    id: attribute.id,
    name: attribute.name,
    value: Object.prototype.hasOwnProperty.call(values, attribute.legacyKey)
      ? values[attribute.legacyKey]
      : 10,
  }));
}

function createDefaultSkills(attributes = DEFAULT_ATTRIBUTES.map((attribute) => ({
  id: attribute.id,
  name: attribute.name,
}))) {
  return DEFAULT_SKILLS.map((skill) => ({
    id: skill.id,
    name: skill.name,
    attributeIds: skill.attributes
      .map((name) => resolverIdAtributo(name, attributes))
      .filter(Boolean),
    attributeId: skill.attributes.length
      ? resolverIdAtributo(skill.attributes[0], attributes)
      : '',
    bonus: 0,
    training: '',
    others: '',
  }));
}

function resolverIdAtributo(name, attributes) {
  const nomeNormalizado = normalizarNome(name);
  const legacyIdsByName = {
    'força': 'attribute-forca',
    intelecto: 'attribute-inteligencia',
    'inteligência': 'attribute-inteligencia',
    'presença': 'attribute-carisma',
    carisma: 'attribute-carisma',
    agilidade: 'attribute-destreza',
    destreza: 'attribute-destreza',
    vigor: 'attribute-constituicao',
    constituição: 'attribute-constituicao',
  };
  const knownId = legacyIdsByName[nomeNormalizado];
  return attributes.find((attribute) =>
    (knownId && attribute.id === knownId) || normalizarNome(attribute.name) === nomeNormalizado
  )?.id || '';
}

// Fica true depois do primeiro aviso de armazenamento bloqueado, para avisar uma vez só.
// Precisa estar antes do loadState(), que é chamado logo abaixo.
let storageWarningShown = false;
let storageWriteEnabled = true;
let appMessageTimer = null;

const defaultState = {
  dataVersion: VERSAO_ATUAL_DADOS,
  theme: 'field',
  attributesHidden: false,
  character: {
    name: 'Aelric Vale',
    className: 'Bárbaro',
    level: 3,
    notes: 'Aventureiro de jornada em busca de mapas antigos.',
    hp: { current: 24, max: 30 },
    sanity: { current: 12, max: 20 },
    effort: { current: 4, max: 8 },
    attributes: createDefaultAttributes({
      forca: 16,
      destreza: 12,
      constituicao: 15,
      inteligencia: 9,
      sabedoria: 11,
      carisma: 10,
    }),
  },
  inventory: [
    { id: generateId(), name: 'Poção de cura', quantity: 2, description: 'Recupera 8 PV.' },
    { id: generateId(), name: 'Mapa antigo', quantity: 1, description: 'Rota para as ruínas do vale.' },
  ],
  arsenal: [],
  diceHistory: [
    { id: generateId(), result: 'd20 = 15', timestamp: new Date().toISOString() },
  ],
  journal: [
    {
      id: generateId(),
      title: 'Primeira entrada',
      content: 'O grupo chegou ao mercado de Brasa Nua e ouviu rumores de uma armadilha na ponte.',
      tags: ['#Combate', '#Quest'],
      timestamp: new Date().toISOString(),
      emotion: '',
      emotionOther: '',
      emotionIntensity: null,
      reflection: {
        thoughts: '',
        feelings: '',
        fears: '',
        desires: '',
        innerConflict: '',
        relationships: '',
        learning: '',
        worldview: '',
      },
    },
  ],
  relationships: [],
  skills: createDefaultSkills(),
};

// Valores neutros para completar dados que faltam num backup ou no que estava salvo.
// O personagem de exemplo (defaultState) aparece só no primeiro acesso, sem nada salvo.
const emptyState = {
  dataVersion: VERSAO_ATUAL_DADOS,
  theme: 'field',
  attributesHidden: false,
  character: {
    name: '',
    className: '',
    level: 1,
    notes: '',
    hp: { current: 30, max: 30 },
    sanity: { current: 20, max: 20 },
    effort: { current: 8, max: 8 },
    attributes: createDefaultAttributes(),
  },
  inventory: [],
  arsenal: [],
  diceHistory: [],
  journal: [],
  relationships: [],
  skills: createDefaultSkills(),
};

const state = loadState();

const characterFields = {
  name: document.getElementById('charName'),
  className: document.getElementById('charClass'),
  level: document.getElementById('charLevel'),
  notes: document.getElementById('charNotes'),
};

const attributesGrid = document.querySelector('.attributes-grid');
const toggleAttributesBtn = document.getElementById('toggleAttributesBtn');
const addAttributeBtn = document.getElementById('addAttributeBtn');
const attributeForm = document.getElementById('attributeForm');
const attributeNameInput = document.getElementById('attributeNameInput');
const attributeValueInput = document.getElementById('attributeValueInput');
const cancelAttributeBtn = document.getElementById('cancelAttributeBtn');

const hpElements = {
  bar: document.getElementById('hpBar'),
  currentText: document.getElementById('hpCurrentText'),
  currentInput: document.getElementById('hpCurrentInput'),
  maxInput: document.getElementById('hpMaxInput'),
  status: document.getElementById('hpStatus'),
};

const sanityElements = {
  bar: document.getElementById('sanityBar'),
  currentText: document.getElementById('sanityCurrentText'),
  currentInput: document.getElementById('sanityCurrentInput'),
  maxInput: document.getElementById('sanityMaxInput'),
  status: document.getElementById('sanityStatus'),
};

const effortElements = {
  bar: document.getElementById('effortBar'),
  currentText: document.getElementById('effortCurrentText'),
  currentInput: document.getElementById('effortCurrentInput'),
  maxInput: document.getElementById('effortMaxInput'),
  status: document.getElementById('effortStatus'),
};

const inventoryForm = document.getElementById('inventoryForm');
const inventoryIdInput = document.getElementById('inventoryId');
const itemNameInput = document.getElementById('itemName');
const itemQtyInput = document.getElementById('itemQty');
const itemDescriptionInput = document.getElementById('itemDescription');
const saveItemBtn = document.getElementById('saveItemBtn');
const inventoryList = document.getElementById('inventoryList');
const cancelEditBtn = document.getElementById('cancelEditBtn');

const arsenalForm = document.getElementById('arsenalForm');
const arsenalIdInput = document.getElementById('arsenalId');
const weaponNameInput = document.getElementById('weaponName');
const weaponQuantityInput = document.getElementById('weaponQuantity');
const weaponDamageInput = document.getElementById('weaponDamage');
const weaponDescriptionInput = document.getElementById('weaponDescription');
const saveWeaponBtn = document.getElementById('saveWeaponBtn');
const cancelWeaponEditBtn = document.getElementById('cancelWeaponEditBtn');
const arsenalList = document.getElementById('arsenalList');
const journalArsenalList = document.getElementById('journalArsenalList');
const arsenalPanel = document.querySelector('.arsenal-panel');

const skillForm = document.getElementById('skillForm');
const skillIdInput = document.getElementById('skillIdInput');
const skillNameInput = document.getElementById('skillNameInput');
const skillAttributeInput = document.getElementById('skillAttributeInput');
const skillBonusInput = document.getElementById('skillBonusInput');
const skillTrainingInput = document.getElementById('skillTrainingInput');
const skillOthersInput = document.getElementById('skillOthersInput');
const addSkillBtn = document.getElementById('addSkillBtn');
const saveSkillBtn = document.getElementById('saveSkillBtn');
const cancelSkillBtn = document.getElementById('cancelSkillBtn');
const skillsList = document.getElementById('skillsList');

const themeToggleBtn = document.getElementById('themeToggle');
const exportBtn = document.getElementById('exportBtn');
const importInput = document.getElementById('importFile');

const lastRollText = document.getElementById('lastRoll');
const diceHistoryList = document.getElementById('diceHistory');
const clearDiceHistoryBtn = document.getElementById('clearDiceHistoryBtn');

const journalForm = document.getElementById('journalForm');
const journalTitleInput = document.getElementById('journalTitleInput');
const journalTagsInput = document.getElementById('journalTagsInput');
const journalContentInput = document.getElementById('journalContent');
const journalEmotionInput = document.getElementById('journalEmotion');
const journalEmotionOtherField = document.getElementById('journalEmotionOtherField');
const journalEmotionOtherInput = document.getElementById('journalEmotionOther');
const journalEmotionIntensityInput = document.getElementById('journalEmotionIntensity');
const journalReflectionFields = {
  thoughts: document.getElementById('journalThoughts'),
  feelings: document.getElementById('journalFeelings'),
  fears: document.getElementById('journalFears'),
  desires: document.getElementById('journalDesires'),
  innerConflict: document.getElementById('journalInnerConflict'),
  relationships: document.getElementById('journalRelationships'),
  learning: document.getElementById('journalLearning'),
  worldview: document.getElementById('journalWorldview'),
};
const journalSearchInput = document.getElementById('journalSearch');
const journalTagFilter = document.getElementById('journalTagFilter');
const journalList = document.getElementById('journalList');
const journalDeleteDialog = document.getElementById('journalDeleteDialog');
const journalDeleteCancelBtn = document.getElementById('journalDeleteCancelBtn');
const journalDeleteConfirmBtn = document.getElementById('journalDeleteConfirmBtn');
let journalEntryPendingDeleteId = null;
const relationshipForm = document.getElementById('relationshipForm');
const relationshipIdInput = document.getElementById('relationshipId');
const relationshipNameInput = document.getElementById('relationshipName');
const relationshipIdentificationInput = document.getElementById('relationshipIdentification');
const relationshipDescriptionInput = document.getElementById('relationshipDescription');
const relationshipBondTypeInput = document.getElementById('relationshipBondType');
const relationshipAffinityInputs = document.querySelectorAll('input[name="relationshipAffinity"]');
const relationshipAffinityLevelInput = document.getElementById('relationshipAffinityLevel');
const relationshipAffinityPreview = document.getElementById('relationshipAffinityPreview');
const saveRelationshipBtn = document.getElementById('saveRelationshipBtn');
const cancelRelationshipEditBtn = document.getElementById('cancelRelationshipEditBtn');
const relationshipsList = document.getElementById('relationshipsList');
const pixelArtDialog = document.getElementById('pixelArtDialog');
const pixelArtCharacterName = document.getElementById('pixelArtCharacterName');
const pixelArtCanvas = document.getElementById('pixelArtCanvas');
const pixelArtContext = pixelArtCanvas.getContext('2d');
const pixelArtResolution = document.getElementById('pixelArtResolution');
const pixelArtPalette = document.getElementById('pixelArtPalette');
const pixelArtCustomColor = document.getElementById('pixelArtCustomColor');
const pixelArtToolStatus = document.getElementById('pixelArtToolStatus');
const pixelArtUndoBtn = document.getElementById('pixelArtUndoBtn');
const pixelArtRedoBtn = document.getElementById('pixelArtRedoBtn');
const pixelArtGridBtn = document.getElementById('pixelArtGridBtn');
const pixelArtZoomValue = document.getElementById('pixelArtZoomValue');
const pixelArtEditor = {
  relationshipId: '',
  width: 32,
  height: 32,
  pixels: [],
  initialValue: '',
  selectedColor: '#70452e',
  tool: 'pencil',
  showGrid: true,
  zoom: 1,
  undoStack: [],
  redoStack: [],
  isPointerDown: false,
  strokeChanged: false,
  strokeSnapshot: null,
  returnFocus: null,
};
const journalReflectionLabels = {
  thoughts: 'O que meu personagem está pensando?',
  feelings: 'O que ele realmente sente sobre o acontecimento?',
  fears: 'Quais são seus maiores medos neste momento?',
  desires: 'O que ele deseja ou precisa?',
  innerConflict: 'Existe algum conflito interno?',
  relationships: 'Como esse acontecimento afetou suas relações com outros personagens?',
  learning: 'O que ele aprendeu ou percebeu com essa experiência?',
  worldview: 'O que mudou em sua maneira de enxergar o mundo?',
};

init();

function init() {
  bindCharacterInputs();
  bindAttributeInputs();
  bindAttributesToggle();
  bindAttributeForm();
  bindHpButtons();
  bindVitalButtons();
  bindVitalCurrentInputs();
  bindVitalMaxInputs();
  bindInventoryForm();
  bindInventoryList();
  bindArsenalForm();
  bindArsenalList();
  bindSkillForm();
  bindSkillsList();
  bindRelationshipForm();
  bindRelationshipsList();
  bindPixelArtEditor();
  bindDiceButtons();
  bindDiceHistoryClear();
  bindJournalForm();
  bindThemeToggle();
  bindBackupActions();
  bindStorageSync();
  renderAll();
}

function generateId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeState(raw) {
  // O que faltar é completado com valores neutros, não com o personagem de exemplo.
  const safe = JSON.parse(JSON.stringify(emptyState));
  // Backup que não é um objeto (array, número, null) é tratado como vazio.
  const merged = deepMerge(safe, isPlainObject(raw) ? raw : {});
  const deveMigrar = !Number.isInteger(raw?.dataVersion) || raw.dataVersion < VERSAO_ATUAL_DADOS;

  if (!isPlainObject(merged.character)) {
    merged.character = { ...safe.character };
  }

  // Recupera hp, sanity e effort quando vierem null ou inválidos.
  // O atual fica sempre entre 0 e o máximo.
  ['hp', 'sanity', 'effort'].forEach((key) => {
    const stat = isPlainObject(merged.character[key]) ? merged.character[key] : safe.character[key];
    // Barras usam só inteiros: decimais antigos são arredondados.
    const max = arredondarOuNulo(clampNumber(stat.max, 1, Infinity, safe.character[key].max));
    const current = arredondarOuNulo(clampNumber(stat.current, 0, max, max));
    merged.character[key] = { ...stat, current, max };
  });

  ['name', 'className', 'notes'].forEach((key) => {
    const value = merged.character[key];
    if (typeof value === 'number') {
      merged.character[key] = String(value);
    } else if (typeof value !== 'string') {
      merged.character[key] = '';
    }
  });
  merged.character.level = arredondarOuNulo(clampNumber(merged.character.level, 1, 99, 1));

  if (!Array.isArray(merged.inventory)) merged.inventory = safe.inventory;
  if (!Array.isArray(merged.arsenal)) merged.arsenal = safe.arsenal;
  if (!Array.isArray(merged.diceHistory)) merged.diceHistory = safe.diceHistory;
  if (!Array.isArray(merged.journal)) merged.journal = safe.journal;
  if (!Array.isArray(merged.relationships)) merged.relationships = safe.relationships;
  if (!Array.isArray(merged.skills)) merged.skills = safe.skills;

  merged.character.attributes = normalizeAttributes(
    merged.character.attributes,
    safe.character.attributes,
    deveMigrar
  );

  // Valida cada item das listas e descarta os inválidos.
  const inventoryIds = new Set();
  const arsenalIds = new Set();
  const diceIds = new Set();
  const journalIds = new Set();
  const relationshipIds = new Set();
  const skillIds = new Set();
  merged.inventory = merged.inventory.map((item) => normalizeInventoryItem(item, inventoryIds)).filter(Boolean);
  merged.arsenal = merged.arsenal.map((weapon) => normalizeWeapon(weapon, arsenalIds)).filter(Boolean);
  merged.diceHistory = merged.diceHistory.map((entry) => normalizeDiceEntry(entry, diceIds)).filter(Boolean).slice(0, 12);
  merged.journal = merged.journal.map((entry) => normalizeJournalEntry(entry, journalIds)).filter(Boolean);
  merged.relationships = merged.relationships
    .map((entry) => normalizeRelationshipItem(entry, relationshipIds))
    .filter(Boolean);
  const attributeIds = new Set(merged.character.attributes.map((attribute) => attribute.id));
  merged.skills = merged.skills
    .map((skill) => normalizeSkill(skill, skillIds, attributeIds))
    .filter((skill) => skill && !REMOVED_SKILL_NAMES.has(normalizarNome(skill.name)));
  if (deveMigrar) {
    migrarAssociacoesPericias(merged.skills, merged.character.attributes);
    adicionarPericiasNovasLegadas(merged.skills, raw, merged.character.attributes);
  }
  merged.skills = deduplicarPericias(merged.skills);
  merged.dataVersion = VERSAO_ATUAL_DADOS;

  if (!merged.theme || !['field', 'journal'].includes(merged.theme)) {
    merged.theme = defaultState.theme;
  }

  if (typeof merged.attributesHidden !== 'boolean') {
    merged.attributesHidden = false;
  }

  return merged;
}

function normalizeAttributes(raw, fallback, deveMigrar = false) {
  const usedIds = new Set();
  if (Array.isArray(raw)) {
    const attributes = deveMigrar ? migrarAtributosLegados(raw) : raw;
    return attributes.map((attribute) => normalizeAttribute(attribute, usedIds)).filter(Boolean);
  }

  if (isPlainObject(raw)) {
    const chavesLegadasConhecidas = new Set([
      ...DEFAULT_ATTRIBUTES.map((attribute) => normalizarNome(attribute.legacyKey)),
      ...ATRIBUTOS_LEGADOS.map((attribute) => normalizarNome(attribute.key)),
      ...DEFAULT_ATTRIBUTES.map((attribute) => normalizarNome(attribute.name)),
      ...ATRIBUTOS_LEGADOS.map((attribute) => normalizarNome(attribute.oldName)),
    ]);
    const fonteAtributos = deveMigrar ? migrarMapaAtributosLegados(raw) : raw;
    const attributes = DEFAULT_ATTRIBUTES.map((definition) => {
      const defaultAttribute = fallback.find((attribute) =>
        attribute.id === definition.id || normalizarNome(attribute.name) === normalizarNome(definition.name)
      );
      return normalizeAttribute({
        id: defaultAttribute?.id || definition.id,
        name: defaultAttribute?.name || definition.name,
        value: Object.prototype.hasOwnProperty.call(fonteAtributos, definition.legacyKey)
          ? fonteAtributos[definition.legacyKey]
          : defaultAttribute?.value,
      }, usedIds);
    }).filter(Boolean);

    Object.keys(raw)
      .filter((key) => !chavesLegadasConhecidas.has(normalizarNome(key)))
      .forEach((key) => {
        const attribute = normalizeAttribute({
          id: `attribute-legacy-${key}`,
          name: key,
          value: fonteAtributos[key],
        }, usedIds);
        if (attribute) attributes.push(attribute);
      });

    return attributes;
  }

  return fallback.map((attribute) => ({ ...attribute }));
}

function normalizeAttribute(attribute, usedIds) {
  if (!isPlainObject(attribute)) return null;
  const name = typeof attribute.name === 'string' ? attribute.name.trim() : '';
  if (!name) return null;

  return {
    ...attribute,
    id: normalizeId(attribute.id, usedIds),
    name,
    value: normalizeFiniteNumber(attribute.value, 10),
  };
}

function normalizeSkill(skill, usedIds, attributeIds) {
  if (!isPlainObject(skill)) return null;
  const name = typeof skill.name === 'string' ? skill.name.trim() : '';
  if (!name) return null;

  const storedAttributeIds = Array.isArray(skill.attributeIds)
    ? skill.attributeIds
    : (typeof skill.attributeId === 'string' && skill.attributeId ? [skill.attributeId] : []);
  const normalizedAttributeIds = [...new Set(storedAttributeIds.filter((id) =>
    typeof id === 'string' && attributeIds.has(id)
  ))];
  return {
    ...skill,
    id: normalizeId(skill.id, usedIds),
    name,
    attributeIds: normalizedAttributeIds,
    attributeId: normalizedAttributeIds[0] || '',
    bonus: normalizeFiniteNumber(skill.bonus, 0),
    training: normalizeEditableText(skill.training),
    others: normalizeEditableText(skill.others),
  };
}

function migrarAtributosLegados(attributes) {
  return attributes.flatMap((attribute) => {
    if (!isPlainObject(attribute)) return [attribute];
    const legacy = ATRIBUTOS_LEGADOS.find((entry) =>
      attribute.id === entry.id || normalizarNome(attribute.name) === normalizarNome(entry.oldName)
    );
    if (!legacy) return [attribute];
    if (!legacy.name) {
      return normalizarNome(attribute.name) === normalizarNome(legacy.oldName) ? [] : [attribute];
    }
    return [{
      ...attribute,
      name: normalizarNome(attribute.name) === normalizarNome(legacy.oldName)
        ? legacy.name
        : attribute.name,
    }];
  });
}

function migrarMapaAtributosLegados(attributes) {
  const valoresPorNome = new Map(Object.entries(attributes)
    .map(([key, value]) => [normalizarNome(key), value]));
  const migrated = {};
  ATRIBUTOS_LEGADOS.filter((legacy) => legacy.name).forEach((legacy) => {
    const value = Object.prototype.hasOwnProperty.call(attributes, legacy.key)
      ? attributes[legacy.key]
      : valoresPorNome.get(normalizarNome(legacy.oldName)) ??
        valoresPorNome.get(normalizarNome(legacy.name));
    if (value !== undefined) migrated[legacy.key] = value;
  });
  Object.keys(attributes).forEach((key) => {
    const isLegacyKey = ATRIBUTOS_LEGADOS.some((legacy) =>
      key === legacy.key ||
      normalizarNome(key) === normalizarNome(legacy.oldName) ||
      (legacy.name && normalizarNome(key) === normalizarNome(legacy.name))
    );
    if (!isLegacyKey) migrated[key] = attributes[key];
  });
  return migrated;
}

function migrarAssociacoesPericias(skills, attributes) {
  skills.forEach((skill) => {
    if (skill.attributeIds.length) return;
    const definition = DEFAULT_SKILLS.find((entry) => normalizarNome(entry.name) === normalizarNome(skill.name));
    if (!definition) return;
    skill.attributeIds = definition.attributes
      .map((name) => resolverIdAtributo(name, attributes))
      .filter(Boolean);
    skill.attributeId = skill.attributeIds[0] || '';
  });
}

function adicionarPericiasNovasLegadas(skills, raw, attributes) {
  if (!Array.isArray(raw?.skills)) return;
  const existingNames = new Set(skills.map((skill) => normalizarNome(skill.name)));
  ['skill-mitologia', 'skill-magia-divina'].forEach((id) => {
    const definition = DEFAULT_SKILLS.find((skill) => skill.id === id);
    if (!definition || existingNames.has(normalizarNome(definition.name))) return;
    const attributeIds = definition.attributes
      .map((name) => resolverIdAtributo(name, attributes))
      .filter(Boolean);
    skills.push({
      id: skills.some((skill) => skill.id === definition.id)
        ? generateUniqueId(skills)
        : definition.id,
      name: definition.name,
      attributeIds,
      attributeId: attributeIds[0] || '',
      bonus: 0,
      training: '',
      others: '',
    });
    existingNames.add(normalizarNome(definition.name));
  });
}

function deduplicarPericias(skills) {
  const uniqueSkills = [];
  const skillsByName = new Map();
  skills.forEach((skill) => {
    const key = normalizarNome(skill.name);
    const existing = skillsByName.get(key);
    if (!existing) {
      skillsByName.set(key, skill);
      uniqueSkills.push(skill);
      return;
    }

    existing.duplicateRecords = [
      ...(Array.isArray(existing.duplicateRecords) ? existing.duplicateRecords : []),
      { ...skill },
    ];
    existing.attributeIds = [...new Set([...existing.attributeIds, ...skill.attributeIds])];
    existing.attributeId = existing.attributeIds[0] || '';
    if (!existing.bonus && skill.bonus) {
      existing.bonus = skill.bonus;
    } else if (existing.bonus !== skill.bonus) {
      existing.duplicateBonuses = [...new Set([
        ...(Array.isArray(existing.duplicateBonuses) ? existing.duplicateBonuses : []),
        skill.bonus,
      ])];
    }
    ['training', 'others'].forEach((field) => {
      if (!skill[field] || existing[field] === skill[field]) return;
      existing[field] = existing[field]
        ? `${existing[field]} / ${skill[field]}`
        : skill[field];
    });
  });
  return uniqueSkills;
}

function normalizarNome(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
}

function normalizeFiniteNumber(value, fallback) {
  if (value === null || value === '' || typeof value === 'boolean') return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeEditableText(value) {
  if (typeof value === 'string') return value;
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

// Converte para número e limita entre min e max. Valor vazio ou inválido vira o padrão.
function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (value === null || value === '' || typeof value === 'boolean' || !Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, number));
}

// Mantém o id se for texto e ainda não tiver sido usado; senão gera um novo.
function normalizeId(id, usedIds) {
  const nextId = typeof id === 'string' && id && !usedIds.has(id) ? id : generateId();
  usedIds.add(nextId);
  return nextId;
}

// Data inválida vira null, porque o formatDate quebra com datas inválidas.
function normalizeTimestamp(value) {
  if (value === null || value === undefined || value === '') return null;
  return Number.isNaN(new Date(value).getTime()) ? null : value;
}

function normalizeInventoryItem(item, usedIds) {
  if (!isPlainObject(item)) return null;

  const name = typeof item.name === 'string' ? item.name.trim() : '';
  if (!name) return null;

  return {
    ...item,
    id: normalizeId(item.id, usedIds),
    name,
    quantity: arredondarOuNulo(clampNumber(item.quantity, 1, Infinity, 1)),
    description: typeof item.description === 'string' ? item.description : '',
  };
}

function normalizeWeapon(weapon, usedIds) {
  if (!isPlainObject(weapon)) return null;

  const name = typeof weapon.name === 'string' ? weapon.name.trim() : '';
  const damage = typeof weapon.damage === 'string' ? weapon.damage.trim() : '';
  const quantity = Number(weapon.quantity);
  if (!name || !damage || !Number.isInteger(quantity) || quantity < 1) return null;

  return {
    ...weapon,
    id: normalizeId(weapon.id, usedIds),
    name,
    quantity,
    damage,
    description: typeof weapon.description === 'string' ? weapon.description : '',
  };
}

function normalizeDiceEntry(entry, usedIds) {
  if (!isPlainObject(entry)) return null;
  if (typeof entry.result !== 'string' || !entry.result.trim()) return null;
  const parsedRoll = parseRollResult(entry.result);
  const sides = entry.sides === null || entry.sides === '' || entry.sides === undefined
    ? NaN
    : Number(entry.sides);
  const value = entry.value === null || entry.value === '' || entry.value === undefined
    ? NaN
    : Number(entry.value);

  return {
    ...entry,
    id: normalizeId(entry.id, usedIds),
    timestamp: normalizeTimestamp(entry.timestamp),
    sides: Number.isInteger(sides) && sides > 0 ? sides : parsedRoll?.sides ?? null,
    value: Number.isFinite(value) ? value : parsedRoll?.value ?? null,
  };
}

function parseRollResult(result) {
  const match = /^d(\d+)\s*=\s*(\d+)$/i.exec(result.trim());
  if (!match) return null;
  return { sides: Number(match[1]), value: Number(match[2]) };
}

function normalizeJournalEntry(entry, usedIds) {
  if (!isPlainObject(entry)) return null;
  if (typeof entry.title !== 'string' || !entry.title.trim()) return null;
  if (typeof entry.content !== 'string' || !entry.content.trim()) return null;

  const reflection = isPlainObject(entry.reflection) ? entry.reflection : {};
  const normalizedReflection = { ...reflection };
  ['thoughts', 'feelings', 'fears', 'desires', 'innerConflict', 'relationships', 'learning', 'worldview']
    .forEach((key) => {
      normalizedReflection[key] = typeof reflection[key] === 'string' ? reflection[key] : '';
    });
  let tags = [];
  if (Array.isArray(entry.tags)) {
    tags = entry.tags.filter((tag) => typeof tag === 'string' && tag.trim());
  } else if (typeof entry.tags === 'string') {
    tags = normalizeTags(entry.tags);
  }

  return {
    ...entry,
    id: normalizeId(entry.id, usedIds),
    tags,
    timestamp: normalizeTimestamp(entry.timestamp),
    emotion: typeof entry.emotion === 'string' ? entry.emotion : '',
    emotionOther: typeof entry.emotionOther === 'string' ? entry.emotionOther : '',
    emotionIntensity: entry.emotionIntensity === null || entry.emotionIntensity === '' ||
      entry.emotionIntensity === undefined
      ? null
      // Arredonda para o medidor (5 bolinhas) bater com o texto "N/5".
      : arredondarOuNulo(clampNumber(entry.emotionIntensity, 1, 5, null)),
    reflection: normalizedReflection,
  };
}

function arredondarOuNulo(value) {
  return value === null ? null : Math.round(value);
}

function normalizeRelationshipItem(entry, usedIds) {
  if (!isPlainObject(entry)) return null;

  const name = typeof entry.name === 'string' ? entry.name.trim() : '';
  const identification = typeof entry.identification === 'string' ? entry.identification.trim() : '';
  if (!name || !identification) return null;
  const affinityLevel = Number(entry.affinityLevel);

  const relationship = {
    ...entry,
    id: normalizeId(entry.id, usedIds),
    name,
    identification,
    bondType: RELATIONSHIP_BOND_TYPES.includes(entry.bondType) ? entry.bondType : 'common',
    affinityType: ['positive', 'negative'].includes(entry.affinityType) ? entry.affinityType : 'positive',
    affinityLevel: Number.isInteger(affinityLevel) && affinityLevel >= 1 && affinityLevel <= 3
      ? affinityLevel
      : 1,
    description: typeof entry.description === 'string' ? entry.description : '',
  };
  if (entry.pixelArt !== undefined && entry.pixelArt !== null) {
    const pixelArt = normalizePixelArt(entry.pixelArt);
    if (pixelArt) relationship.pixelArt = pixelArt;
    else delete relationship.pixelArt;
  }
  return relationship;
}

function normalizePixelArt(pixelArt) {
  if (!isPlainObject(pixelArt)) return null;
  const width = Number(pixelArt.width);
  const height = Number(pixelArt.height);
  if (!PIXEL_ART_SIZES.has(width) || width !== height ||
    !Array.isArray(pixelArt.pixels) || pixelArt.pixels.length !== width * height) {
    return null;
  }

  const pixels = pixelArt.pixels.map((color) => (
    color === null || (typeof color === 'string' && /^#[\da-f]{6}$/i.test(color))
      ? (typeof color === 'string' ? color.toLowerCase() : null)
      : undefined
  ));
  if (pixels.some((color) => color === undefined)) return null;
  return { width, height, pixels };
}

function deepMerge(base, incoming) {
  if (Array.isArray(base) || Array.isArray(incoming)) {
    return incoming ?? base;
  }

  const output = { ...base };
  Object.keys(incoming || {}).forEach((key) => {
    if (incoming[key] && typeof incoming[key] === 'object' && !Array.isArray(incoming[key])) {
      output[key] = deepMerge(base[key] || {}, incoming[key]);
    } else {
      output[key] = incoming[key];
    }
  });
  return output;
}

// Se o armazenamento estiver bloqueado ou cheio, o site continua funcionando só em memória.
function warnStorageUnavailable(error) {
  if (storageWarningShown) {
    avisarDadosNaoSalvos();
    return;
  }
  storageWarningShown = true;
  console.warn(
    'Não foi possível usar o armazenamento do navegador. Os dados não serão salvos ao fechar a página. Use "Exportar Backup" para guardar uma cópia.',
    error
  );
  showAppMessage(
    'Não foi possível salvar neste navegador. Seus dados continuam disponíveis nesta sessão; exporte um backup para guardá-los.',
    'warning'
  );
}

// Repete o aviso a cada gravação que falha, quando a mensagem anterior já sumiu,
// para a pessoa não achar que as alterações estão sendo salvas.
function avisarDadosNaoSalvos() {
  if (!appStatus.hidden) return;
  showAppMessage(
    'Não foi possível salvar neste navegador. Seus dados continuam disponíveis nesta sessão; exporte um backup para guardá-los.',
    'warning'
  );
}

function showAppMessage(message, type = 'success') {
  window.clearTimeout(appMessageTimer);
  appStatus.className = `app-status ${type}`;
  appStatus.setAttribute('role', type === 'error' ? 'alert' : 'status');
  appStatus.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
  appStatus.hidden = false;
  appStatus.textContent = message;
  appMessageTimer = window.setTimeout(() => {
    appStatus.hidden = true;
    appStatus.textContent = '';
  }, 7000);
}

function saveState(stateToSave = state, force = false) {
  if (!storageWriteEnabled && !force) {
    avisarDadosNaoSalvos();
    return false;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    storageWriteEnabled = true;
    return true;
  } catch (error) {
    warnStorageUnavailable(error);
    return false;
  }
}

function loadState() {
  let saved = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    storageWriteEnabled = false;
    warnStorageUnavailable(error);
    return structuredClone(defaultState);
  }

  if (saved === null) return structuredClone(defaultState);

  try {
    const parsed = JSON.parse(saved);
    if (!isPlainObject(parsed)) {
      throw new Error('O estado salvo não é um objeto válido.');
    }
    const normalized = normalizeState(parsed);
    const containsRemovedSkills = Array.isArray(parsed.skills) &&
      parsed.skills.some((skill) => isPlainObject(skill) && REMOVED_SKILL_NAMES.has(normalizarNome(skill.name)));
    if (normalized.dataVersion !== parsed.dataVersion || containsRemovedSkills) saveState(normalized);
    return normalized;
  } catch (error) {
    storageWriteEnabled = false;
    console.warn('Falha ao carregar estado salvo. O conteúdo existente foi preservado; usando estado padrão.', error);
    showAppMessage(
      'Não foi possível ler os dados salvos. A página seguirá com dados temporários e o conteúdo anterior não foi apagado.',
      'warning'
    );
    return structuredClone(defaultState);
  }
}

function bindCharacterInputs() {
  Object.entries(characterFields).forEach(([key, input]) => {
    input.addEventListener('input', (event) => {
      const value = event.target.value;
      if (key === 'level') {
        // Enquanto digita, só salva números válidos; o campo é corrigido no change.
        const level = arredondarOuNulo(clampNumber(value, 1, 99, null));
        if (level === null) return;
        state.character.level = level;
      } else if (key === 'name' || key === 'className' || key === 'notes') {
        state.character[key] = value;
      }
      saveState();
    });
  });

  // Ao sair do campo (ou apertar Enter), o nível fica entre 1 e 99.
  characterFields.level.addEventListener('change', () => {
    state.character.level = arredondarOuNulo(clampNumber(characterFields.level.value, 1, 99, 1));
    saveState();
    renderCharacterBlock();
  });
}

function bindAttributeInputs() {
  attributesGrid.addEventListener('input', (event) => {
    const input = event.target.closest('[data-attribute-value]');
    if (!input || input.value === '') return;
    const attribute = state.character.attributes.find((entry) => entry.id === input.closest('.attribute').dataset.attributeId);
    const value = Number(input.value);
    if (!attribute || !Number.isFinite(value)) return;
    attribute.value = value;
    saveState();
  });

  attributesGrid.addEventListener('change', (event) => {
    const input = event.target.closest('[data-attribute-name], [data-attribute-value]');
    if (!input) return;
    const attribute = state.character.attributes.find((entry) => entry.id === input.closest('.attribute').dataset.attributeId);
    if (!attribute) return;

    if (input.matches('[data-attribute-name]')) {
      const name = input.value.trim();
      if (!name) {
        input.value = attribute.name;
        showAppMessage('O nome do atributo não pode ficar vazio.', 'error');
        return;
      }
      attribute.name = name;
      input.value = name;
      input.setAttribute('aria-label', `Nome do atributo ${name}`);
      const card = input.closest('.attribute');
      card.querySelector('.attribute-value-field .sr-only').textContent = `Valor de ${name}`;
      card.querySelector('[data-attribute-value]').setAttribute('aria-label', `Valor de ${name}`);
      saveState();
      renderSkills();
      return;
    }

    attribute.value = normalizeFiniteNumber(input.value, attribute.value);
    saveState();
    renderAttributes();
  });
}

function bindAttributeForm() {
  addAttributeBtn.addEventListener('click', () => {
    attributeForm.hidden = false;
    attributeNameInput.focus();
  });

  attributeForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = attributeNameInput.value.trim();
    const value = normalizeFiniteNumber(attributeValueInput.value, null);
    if (!name || value === null) {
      showAppMessage('Informe um nome e um valor numérico válido para o atributo.', 'error');
      (name ? attributeValueInput : attributeNameInput).focus();
      return;
    }

    state.character.attributes.push({
      id: generateUniqueId(state.character.attributes),
      name,
      value,
    });
    const saved = saveState();
    clearAttributeForm();
    renderAttributes();
    renderSkills();
    if (saved) showAppMessage('Atributo adicionado à ficha.');
  });

  cancelAttributeBtn.addEventListener('click', clearAttributeForm);
}

function clearAttributeForm() {
  attributeForm.reset();
  attributeValueInput.value = 10;
  attributeForm.hidden = true;
}

function generateUniqueId(items) {
  let id = generateId();
  while (items.some((item) => item.id === id)) {
    id = generateId();
  }
  return id;
}

function bindAttributesToggle() {
  toggleAttributesBtn.addEventListener('click', () => {
    state.attributesHidden = !state.attributesHidden;
    saveState();
    renderAttributes();
  });
}

function bindHpButtons() {
  document.querySelectorAll('.hp-btn[data-stat="hp"]').forEach((button) => {
    button.addEventListener('click', () => {
      const change = Number(button.dataset.change || 0);
      const max = Number(state.character.hp.max || 0);
      const current = Number(state.character.hp.current || 0);
      const next = Math.max(0, Math.min(max, current + change));
      state.character.hp.current = next;
      saveState();
      renderHp();
    });
  });
}

function bindVitalButtons() {
  document.querySelectorAll('.vital-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const stat = button.dataset.stat;
      const change = Number(button.dataset.change || 0);
      const maxKey = stat === 'sanity' ? 'sanity' : 'effort';
      const max = Number(state.character[maxKey]?.max || 0);
      const current = Number(state.character[maxKey]?.current || 0);
      const next = Math.max(0, Math.min(max, current + change));
      state.character[maxKey].current = next;
      saveState();

      if (stat === 'sanity') {
        renderSanity();
      } else {
        renderEffort();
      }
    });
  });
}

function bindVitalCurrentInputs() {
  const configs = [
    { key: 'hp', element: hpElements.currentInput, render: renderHp },
    { key: 'sanity', element: sanityElements.currentInput, render: renderSanity },
    { key: 'effort', element: effortElements.currentInput, render: renderEffort },
  ];

  configs.forEach(({ key, element, render }) => {
    element.addEventListener('input', () => {
      const current = arredondarOuNulo(normalizeFiniteNumber(element.value, null));
      if (current === null) return;

      const stat = state.character[key];
      stat.current = Math.min(stat.max, Math.max(0, current));
      saveState();
      render(current === stat.current);
    });

    element.addEventListener('change', () => {
      const stat = state.character[key];
      const current = Math.round(normalizeFiniteNumber(element.value, stat.current));
      stat.current = Math.min(stat.max, Math.max(0, current));
      saveState();
      render();
    });
  });
}

function bindVitalMaxInputs() {
  const configs = [
    { key: 'hp', element: hpElements.maxInput, path: 'character.hp' },
    { key: 'sanity', element: sanityElements.maxInput, path: 'character.sanity' },
    { key: 'effort', element: effortElements.maxInput, path: 'character.effort' },
  ];

  configs.forEach(({ key, element, path }) => {
    const renderStat = () => {
      if (key === 'hp') renderHp();
      if (key === 'sanity') renderSanity();
      if (key === 'effort') renderEffort();
    };

    element.addEventListener('input', () => {
      const nextMax = arredondarOuNulo(normalizeFiniteNumber(element.value, null));
      if (nextMax === null) return;
      renderVitalPreview(key, Math.max(0, nextMax));
    });

    // Ao sair do campo, confirma o máximo e ajusta o atual para não passar dele.
    // Isso é feito só aqui para não perder o valor atual enquanto a pessoa digita.
    element.addEventListener('change', () => {
      const currentStat = getNestedValue(state, path) || { max: 1, current: 0 };
      const typedMax = arredondarOuNulo(normalizeFiniteNumber(element.value, null));
      const nextMax = typedMax !== null && typedMax > 0
        ? typedMax
        : Math.max(1, Number(currentStat.max) || 1);

      setNestedValue(state, path, {
        ...currentStat,
        max: nextMax,
        current: Math.min(Number(currentStat.current) || 0, nextMax),
      });
      saveState();
      renderStat();
    });
  });
}

function renderVitalPreview(key, max) {
  const elements = key === 'hp' ? hpElements : key === 'sanity' ? sanityElements : effortElements;
  const current = Math.min(Number(state.character[key].current) || 0, max);
  const percentage = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  updateProgressBar(elements.bar, current, max, percentage, current <= 0 || percentage < 25);
  elements.currentText.textContent = current;
  elements.currentInput.value = current;
  updateVitalStatus(key, elements.status, current, percentage);
}

function getNestedValue(object, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], object);
}

function setNestedValue(object, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((acc, key) => acc[key], object);
  target[lastKey] = value;
}

function bindInventoryForm() {
  inventoryForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const id = inventoryIdInput.value;
    const item = {
      id: id || generateId(),
      name: itemNameInput.value.trim(),
      quantity: Math.max(1, Math.round(Number(itemQtyInput.value)) || 1),
      // O campo fica oculto no Diário, mas guarda a descrição carregada ao editar.
      description: itemDescriptionInput.value.trim(),
    };

    if (!item.name) {
      showAppMessage('Informe o nome do item antes de salvar.', 'error');
      itemNameInput.focus();
      return;
    }

    const editing = Boolean(id);
    if (id) {
      const index = state.inventory.findIndex((entry) => entry.id === id);
      if (index >= 0) {
        state.inventory[index] = { ...state.inventory[index], ...item };
      }
    } else {
      state.inventory.unshift(item);
    }

    const saved = saveState();
    inventoryForm.reset();
    inventoryIdInput.value = '';
    itemQtyInput.value = 1;
    cancelEditBtn.classList.add('hidden');
    saveItemBtn.textContent = 'Adicionar item';
    renderInventory();
    if (saved) showAppMessage(editing ? 'Alterações do item salvas.' : 'Item adicionado ao inventário.');
  });

  cancelEditBtn.addEventListener('click', () => {
    clearInventoryForm();
    showAppMessage('Edição cancelada.');
  });
}

function bindInventoryList() {
  inventoryList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const itemId = button.dataset.id;
    if (button.dataset.action === 'edit') {
      const item = state.inventory.find((entry) => entry.id === itemId);
      if (!item) return;
      inventoryIdInput.value = item.id;
      itemNameInput.value = item.name;
      itemQtyInput.value = item.quantity;
      itemDescriptionInput.value = item.description || '';
      cancelEditBtn.classList.remove('hidden');
      saveItemBtn.textContent = 'Salvar alterações';
      itemNameInput.focus();
      return;
    }

    if (button.dataset.action === 'delete') {
      if (inventoryIdInput.value === itemId) clearInventoryForm();
      state.inventory = state.inventory.filter((entry) => entry.id !== itemId);
      const saved = saveState();
      renderInventory();
      if (saved) showAppMessage('Item removido do inventário.');
    }
  });
}

function bindArsenalForm() {
  arsenalForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const id = arsenalIdInput.value;
    const name = weaponNameInput.value.trim();
    const quantity = Number(weaponQuantityInput.value);
    const damage = weaponDamageInput.value.trim();

    if (!name) {
      showAppMessage('Informe o nome da arma antes de salvar.', 'error');
      weaponNameInput.focus();
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      showAppMessage('A quantidade da arma deve ser um número inteiro positivo.', 'error');
      weaponQuantityInput.focus();
      return;
    }
    if (!damage) {
      showAppMessage('Informe a expressão de dano da arma.', 'error');
      weaponDamageInput.focus();
      return;
    }

    const weapon = {
      id: id || generateUniqueId(state.arsenal),
      name,
      quantity,
      damage,
      // O campo fica oculto no Diário, mas guarda a descrição carregada ao editar.
      description: weaponDescriptionInput.value.trim(),
    };
    const editingIndex = id ? state.arsenal.findIndex((entry) => entry.id === id) : -1;
    if (id && editingIndex < 0) {
      showAppMessage('Esta arma não está mais disponível para edição.', 'error');
      clearArsenalForm();
      return;
    }

    if (editingIndex >= 0) {
      state.arsenal[editingIndex] = { ...state.arsenal[editingIndex], ...weapon };
    } else {
      state.arsenal.unshift(weapon);
    }

    const saved = saveState();
    clearArsenalForm();
    renderArsenal();
    if (saved) showAppMessage(editingIndex >= 0 ? 'Arma atualizada no Arsenal.' : 'Arma adicionada ao Arsenal.');
  });

  cancelWeaponEditBtn.addEventListener('click', () => {
    clearArsenalForm();
    showAppMessage('Edição da arma cancelada.');
  });
}

function bindArsenalList() {
  arsenalPanel.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const weapon = state.arsenal.find((entry) => entry.id === button.dataset.id);
    if (!weapon) return;

    if (button.dataset.action === 'edit') {
      arsenalIdInput.value = weapon.id;
      weaponNameInput.value = weapon.name;
      weaponQuantityInput.value = weapon.quantity;
      weaponDamageInput.value = weapon.damage;
      weaponDescriptionInput.value = weapon.description || '';
      saveWeaponBtn.textContent = 'Salvar alterações';
      cancelWeaponEditBtn.classList.remove('hidden');
      weaponNameInput.focus();
      return;
    }

    if (button.dataset.action === 'delete' &&
      window.confirm(`Remover a arma "${weapon.name}" do Arsenal?`)) {
      if (arsenalIdInput.value === weapon.id) clearArsenalForm();
      state.arsenal = state.arsenal.filter((entry) => entry.id !== weapon.id);
      const saved = saveState();
      renderArsenal();
      if (saved) showAppMessage('Arma removida do Arsenal.');
    }
  });
}

function bindSkillForm() {
  addSkillBtn.addEventListener('click', () => {
    clearSkillForm();
    skillForm.hidden = false;
    skillNameInput.focus();
  });

  skillForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = skillNameInput.value.trim();
    const bonus = normalizeFiniteNumber(skillBonusInput.value, 0);
    if (!name) {
      showAppMessage('Informe o nome da perícia.', 'error');
      skillNameInput.focus();
      return;
    }

    const id = skillIdInput.value;
    if (state.skills.some((entry) =>
      entry.id !== id && normalizarNome(entry.name) === normalizarNome(name)
    )) {
      showAppMessage('Já existe uma perícia com esse nome.', 'error');
      skillNameInput.focus();
      return;
    }
    const attributeIds = Array.from(skillAttributeInput.selectedOptions)
      .map((option) => option.value)
      .filter(Boolean);
    const skill = {
      id: id || generateUniqueId(state.skills),
      name,
      attributeIds,
      attributeId: attributeIds[0] || '',
      bonus,
      training: skillTrainingInput.value.trim(),
      others: skillOthersInput.value.trim(),
    };
    const editingIndex = id ? state.skills.findIndex((entry) => entry.id === id) : -1;
    if (id && editingIndex < 0) {
      showAppMessage('Esta perícia não está mais disponível para edição.', 'error');
      clearSkillForm();
      return;
    }

    if (editingIndex >= 0) {
      // Mantém campos que o formulário não mostra (ex.: duplicateRecords).
      state.skills[editingIndex] = { ...state.skills[editingIndex], ...skill };
    } else {
      state.skills.unshift(skill);
    }

    const saved = saveState();
    clearSkillForm();
    renderSkills();
    if (saved) showAppMessage(editingIndex >= 0 ? 'Perícia atualizada.' : 'Perícia adicionada.');
  });

  cancelSkillBtn.addEventListener('click', clearSkillForm);
}

function bindSkillsList() {
  skillsList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const skill = state.skills.find((entry) => entry.id === button.dataset.id);
    if (!skill) return;

    if (button.dataset.action === 'edit') {
      skillIdInput.value = skill.id;
      skillNameInput.value = skill.name;
      Array.from(skillAttributeInput.options).forEach((option) => {
        option.selected = skill.attributeIds.includes(option.value);
      });
      skillBonusInput.value = skill.bonus;
      skillTrainingInput.value = skill.training;
      skillOthersInput.value = skill.others;
      saveSkillBtn.textContent = 'Salvar alterações';
      skillForm.hidden = false;
      skillNameInput.focus();
      return;
    }

    if (button.dataset.action === 'delete' &&
      window.confirm(`Remover a perícia "${skill.name}"?`)) {
      state.skills = state.skills.filter((entry) => entry.id !== skill.id);
      if (skillIdInput.value === skill.id) clearSkillForm();
      const saved = saveState();
      renderSkills();
      if (saved) showAppMessage('Perícia removida.');
    }
  });
}

function clearSkillForm() {
  skillForm.reset();
  skillIdInput.value = '';
  skillBonusInput.value = 0;
  saveSkillBtn.textContent = 'Salvar perícia';
  skillForm.hidden = true;
  renderSkills();
}

function bindRelationshipForm() {
  relationshipBondTypeInput.addEventListener('change', updateRelationshipAffinityPreview);
  relationshipAffinityInputs.forEach((input) => {
    input.addEventListener('change', updateRelationshipAffinityPreview);
  });
  relationshipAffinityLevelInput.addEventListener('change', updateRelationshipAffinityPreview);

  relationshipForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = relationshipNameInput.value.trim();
    const identification = relationshipIdentificationInput.value.trim();
    if (!name || !identification) {
      showAppMessage('Informe o nome e a identificação da relação.', 'error');
      (name ? relationshipIdentificationInput : relationshipNameInput).focus();
      return;
    }

    const id = relationshipIdInput.value;
    const editingIndex = id
      ? state.relationships.findIndex((entry) => entry.id === id)
      : -1;
    const relationship = {
      ...(editingIndex >= 0 ? state.relationships[editingIndex] : {}),
      id: id || generateId(),
      name,
      identification,
      bondType: relationshipBondTypeInput.value,
      affinityType: relationshipForm.querySelector('input[name="relationshipAffinity"]:checked').value,
      affinityLevel: Number(relationshipAffinityLevelInput.value),
      description: relationshipDescriptionInput.value.trim(),
    };

    if (id && editingIndex < 0) {
      showAppMessage('Esta relação não está mais disponível para edição.', 'error');
      clearRelationshipForm();
      return;
    }

    if (editingIndex >= 0) {
      state.relationships[editingIndex] = relationship;
    } else {
      state.relationships.unshift(relationship);
    }

    const saved = saveState();
    clearRelationshipForm();
    renderRelationships();
    if (saved) {
      showAppMessage(editingIndex >= 0 ? 'Relação atualizada.' : 'Relação adicionada.');
    }
  });

  cancelRelationshipEditBtn.addEventListener('click', () => {
    clearRelationshipForm();
    showAppMessage('Edição da relação cancelada.');
  });

  updateRelationshipAffinityPreview();
}

function bindRelationshipsList() {
  relationshipsList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const relationship = state.relationships.find((entry) => entry.id === button.dataset.id);
    if (!relationship) return;

    if (button.dataset.action === 'pixel-art') {
      openPixelArtEditor(relationship);
      return;
    }

    if (button.dataset.action === 'edit') {
      relationshipIdInput.value = relationship.id;
      relationshipNameInput.value = relationship.name;
      relationshipIdentificationInput.value = relationship.identification;
      relationshipDescriptionInput.value = relationship.description || '';
      relationshipBondTypeInput.value = relationship.bondType;
      relationshipAffinityInputs.forEach((input) => {
        input.checked = input.value === relationship.affinityType;
      });
      relationshipAffinityLevelInput.value = String(relationship.affinityLevel);
      saveRelationshipBtn.textContent = 'Salvar alterações';
      cancelRelationshipEditBtn.classList.remove('hidden');
      updateRelationshipAffinityPreview();
      relationshipNameInput.focus();
      return;
    }

    if (button.dataset.action === 'delete' &&
      window.confirm(`Remover a relação com "${relationship.name}"?`)) {
      state.relationships = state.relationships.filter((entry) => entry.id !== relationship.id);
      if (relationshipIdInput.value === relationship.id) clearRelationshipForm();
      const saved = saveState();
      renderRelationships();
      if (saved) showAppMessage('Relação removida.');
    }
  });
}

function clearRelationshipForm() {
  relationshipForm.reset();
  relationshipIdInput.value = '';
  saveRelationshipBtn.textContent = 'Adicionar relação';
  cancelRelationshipEditBtn.classList.add('hidden');
  updateRelationshipAffinityPreview();
}

function bindPixelArtEditor() {
  PIXEL_ART_PALETTE.forEach(({ name, color }) => {
    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className = 'pixel-art-swatch';
    swatch.dataset.pixelColor = color;
    swatch.style.backgroundColor = color;
    swatch.setAttribute('aria-label', name);
    swatch.setAttribute('title', name);
    swatch.setAttribute('aria-pressed', String(color === pixelArtEditor.selectedColor));
    pixelArtPalette.appendChild(swatch);
  });

  pixelArtDialog.querySelectorAll('[data-pixel-tool]').forEach((button) => {
    button.addEventListener('click', () => selectPixelArtTool(button.dataset.pixelTool));
  });
  pixelArtPalette.addEventListener('click', (event) => {
    const swatch = event.target.closest('button[data-pixel-color]');
    if (swatch) selectPixelArtColor(swatch.dataset.pixelColor);
  });
  pixelArtCustomColor.addEventListener('input', () => {
    selectPixelArtColor(pixelArtCustomColor.value);
  });
  pixelArtResolution.addEventListener('change', () => resizePixelArt(Number(pixelArtResolution.value)));
  pixelArtGridBtn.addEventListener('click', togglePixelArtGrid);
  document.getElementById('pixelArtZoomOutBtn').addEventListener('click', () => changePixelArtZoom(-0.25));
  document.getElementById('pixelArtZoomInBtn').addEventListener('click', () => changePixelArtZoom(0.25));
  pixelArtUndoBtn.addEventListener('click', undoPixelArt);
  pixelArtRedoBtn.addEventListener('click', redoPixelArt);
  document.getElementById('pixelArtClearBtn').addEventListener('click', clearPixelArt);
  document.getElementById('pixelArtSaveBtn').addEventListener('click', savePixelArt);
  document.getElementById('pixelArtCancelBtn').addEventListener('click', requestPixelArtClose);
  document.getElementById('pixelArtCloseBtn').addEventListener('click', requestPixelArtClose);

  pixelArtCanvas.addEventListener('pointerdown', beginPixelArtStroke);
  pixelArtCanvas.addEventListener('pointermove', continuePixelArtStroke);
  pixelArtCanvas.addEventListener('pointerup', finishPixelArtStroke);
  pixelArtCanvas.addEventListener('pointercancel', finishPixelArtStroke);
  pixelArtCanvas.addEventListener('lostpointercapture', finishPixelArtStroke);

  pixelArtDialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    requestPixelArtClose();
  });
  pixelArtDialog.addEventListener('click', (event) => {
    if (event.target === pixelArtDialog) requestPixelArtClose();
  });
  pixelArtDialog.addEventListener('close', restorePixelArtFocus);
  pixelArtDialog.addEventListener('keydown', (event) => {
    if (event.target !== pixelArtCanvas || !event.ctrlKey) return;
    if (event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (event.shiftKey) redoPixelArt();
      else undoPixelArt();
    } else if (event.key.toLowerCase() === 'y') {
      event.preventDefault();
      redoPixelArt();
    }
  });
  window.addEventListener('resize', () => {
    if (pixelArtDialog.open) renderPixelArtCanvas();
  });
}

function openPixelArtEditor(relationship) {
  if (document.body.dataset.theme !== 'journal' || pixelArtDialog.open) return;

  const savedArt = normalizePixelArt(relationship.pixelArt);
  const width = savedArt?.width || 32;
  const height = savedArt?.height || 32;
  const pixels = savedArt?.pixels || Array(width * height).fill(null);
  pixelArtEditor.relationshipId = relationship.id;
  pixelArtEditor.width = width;
  pixelArtEditor.height = height;
  pixelArtEditor.pixels = pixels.slice();
  pixelArtEditor.initialValue = serializePixelArt();
  pixelArtEditor.dirty = false;
  pixelArtEditor.selectedColor = '#70452e';
  pixelArtEditor.tool = 'pencil';
  pixelArtEditor.showGrid = true;
  pixelArtEditor.zoom = 1;
  pixelArtEditor.undoStack = [];
  pixelArtEditor.redoStack = [];
  pixelArtEditor.isPointerDown = false;
  pixelArtEditor.strokeChanged = false;
  pixelArtEditor.strokeSnapshot = null;
  pixelArtEditor.returnFocus = document.activeElement;
  pixelArtCharacterName.textContent = relationship.name;
  pixelArtResolution.value = String(width);
  pixelArtCustomColor.value = pixelArtEditor.selectedColor;
  updatePixelArtControls();
  renderPixelArtCanvas();
  pixelArtDialog.showModal();
  pixelArtCanvas.focus();
}

function serializePixelArt() {
  return JSON.stringify({
    width: pixelArtEditor.width,
    height: pixelArtEditor.height,
    pixels: pixelArtEditor.pixels,
  });
}

function snapshotPixelArt() {
  return {
    width: pixelArtEditor.width,
    height: pixelArtEditor.height,
    pixels: pixelArtEditor.pixels.slice(),
  };
}

function pushPixelArtHistory(stack, snapshot) {
  stack.push(snapshot);
  if (stack.length > PIXEL_ART_HISTORY_LIMIT) stack.shift();
}

function updatePixelArtDirtyState() {
  pixelArtEditor.dirty = serializePixelArt() !== pixelArtEditor.initialValue;
}

function restorePixelArtSnapshot(snapshot) {
  pixelArtEditor.width = snapshot.width;
  pixelArtEditor.height = snapshot.height;
  pixelArtEditor.pixels = snapshot.pixels.slice();
  pixelArtResolution.value = String(snapshot.width);
  renderPixelArtCanvas();
  updatePixelArtControls();
}

function selectPixelArtTool(tool) {
  if (!['pencil', 'eraser', 'fill'].includes(tool)) return;
  pixelArtEditor.tool = tool;
  updatePixelArtControls();
}

function selectPixelArtColor(color) {
  if (typeof color !== 'string' || !/^#[\da-f]{6}$/i.test(color)) return;
  pixelArtEditor.selectedColor = color.toLowerCase();
  pixelArtCustomColor.value = pixelArtEditor.selectedColor;
  pixelArtEditor.tool = 'pencil';
  updatePixelArtControls();
}

function updatePixelArtControls() {
  const toolNames = { pencil: 'Lápis', eraser: 'Borracha', fill: 'Balde' };
  pixelArtDialog.querySelectorAll('[data-pixel-tool]').forEach((button) => {
    const selected = button.dataset.pixelTool === pixelArtEditor.tool;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  pixelArtPalette.querySelectorAll('[data-pixel-color]').forEach((swatch) => {
    swatch.setAttribute('aria-pressed', String(swatch.dataset.pixelColor === pixelArtEditor.selectedColor));
  });
  pixelArtToolStatus.textContent = pixelArtEditor.tool === 'eraser'
    ? `${toolNames[pixelArtEditor.tool]} · transparente`
    : `${toolNames[pixelArtEditor.tool]} · ${pixelArtEditor.selectedColor}`;
  pixelArtUndoBtn.disabled = pixelArtEditor.undoStack.length === 0;
  pixelArtRedoBtn.disabled = pixelArtEditor.redoStack.length === 0;
  pixelArtGridBtn.setAttribute('aria-pressed', String(pixelArtEditor.showGrid));
  pixelArtGridBtn.textContent = `Grade: ${pixelArtEditor.showGrid ? 'ligada' : 'desligada'}`;
  const zoomPercent = Math.round(pixelArtEditor.zoom * 100);
  pixelArtZoomValue.value = `${zoomPercent}%`;
  pixelArtZoomValue.textContent = `${zoomPercent}%`;
}

function renderPixelArtCanvas() {
  pixelArtCanvas.width = pixelArtEditor.width;
  pixelArtCanvas.height = pixelArtEditor.height;
  const displaySize = window.matchMedia('(max-width: 640px)').matches ? 240 : 320;
  pixelArtCanvas.style.width = `${Math.round(displaySize * pixelArtEditor.zoom)}px`;
  pixelArtCanvas.style.height = `${Math.round(displaySize * pixelArtEditor.zoom)}px`;
  pixelArtContext.clearRect(0, 0, pixelArtEditor.width, pixelArtEditor.height);
  pixelArtContext.imageSmoothingEnabled = false;
  pixelArtEditor.pixels.forEach((color, index) => {
    if (!color) return;
    pixelArtContext.fillStyle = color;
    pixelArtContext.fillRect(
      index % pixelArtEditor.width,
      Math.floor(index / pixelArtEditor.width),
      1,
      1
    );
  });
  if (pixelArtEditor.showGrid) {
    pixelArtContext.beginPath();
    pixelArtContext.strokeStyle = 'rgba(24, 17, 12, 0.32)';
    pixelArtContext.lineWidth = 0.06;
    for (let coordinate = 1; coordinate < pixelArtEditor.width; coordinate += 1) {
      pixelArtContext.moveTo(coordinate, 0);
      pixelArtContext.lineTo(coordinate, pixelArtEditor.height);
      pixelArtContext.moveTo(0, coordinate);
      pixelArtContext.lineTo(pixelArtEditor.width, coordinate);
    }
    pixelArtContext.stroke();
  }
}

function getPixelArtPosition(event) {
  const bounds = pixelArtCanvas.getBoundingClientRect();
  const x = Math.floor((event.clientX - bounds.left) / bounds.width * pixelArtEditor.width);
  const y = Math.floor((event.clientY - bounds.top) / bounds.height * pixelArtEditor.height);
  return {
    x: Math.max(0, Math.min(pixelArtEditor.width - 1, x)),
    y: Math.max(0, Math.min(pixelArtEditor.height - 1, y)),
  };
}

function paintPixelArtPoint(x, y) {
  const index = y * pixelArtEditor.width + x;
  const color = pixelArtEditor.tool === 'eraser' ? null : pixelArtEditor.selectedColor;
  if (pixelArtEditor.pixels[index] === color) return false;
  pixelArtEditor.pixels[index] = color;
  return true;
}

function paintPixelArtLine(from, to) {
  let x = from.x;
  let y = from.y;
  const deltaX = Math.abs(to.x - from.x);
  const deltaY = Math.abs(to.y - from.y);
  const stepX = from.x < to.x ? 1 : -1;
  const stepY = from.y < to.y ? 1 : -1;
  let error = deltaX - deltaY;
  let changed = false;

  while (true) {
    changed = paintPixelArtPoint(x, y) || changed;
    if (x === to.x && y === to.y) break;
    const doubledError = error * 2;
    if (doubledError > -deltaY) {
      error -= deltaY;
      x += stepX;
    }
    if (doubledError < deltaX) {
      error += deltaX;
      y += stepY;
    }
  }
  return changed;
}

function beginPixelArtStroke(event) {
  if (event.button !== 0 || !pixelArtEditor.relationshipId) return;
  event.preventDefault();
  const point = getPixelArtPosition(event);
  const index = point.y * pixelArtEditor.width + point.x;

  if (pixelArtEditor.tool === 'fill') {
    const previous = snapshotPixelArt();
    const changed = floodFillPixelArt(index);
    if (changed) {
      pushPixelArtHistory(pixelArtEditor.undoStack, previous);
      pixelArtEditor.redoStack = [];
      updatePixelArtDirtyState();
      updatePixelArtControls();
      renderPixelArtCanvas();
    }
    return;
  }

  pixelArtEditor.strokeSnapshot = snapshotPixelArt();
  pixelArtEditor.isPointerDown = true;
  pixelArtEditor.strokeChanged = paintPixelArtPoint(point.x, point.y);
  pixelArtEditor.lastPoint = point;
  pixelArtCanvas.setPointerCapture(event.pointerId);
  if (pixelArtEditor.strokeChanged) renderPixelArtCanvas();
}

function continuePixelArtStroke(event) {
  if (!pixelArtEditor.isPointerDown) return;
  event.preventDefault();
  const point = getPixelArtPosition(event);
  const changed = paintPixelArtLine(pixelArtEditor.lastPoint, point);
  pixelArtEditor.lastPoint = point;
  if (changed) {
    pixelArtEditor.strokeChanged = true;
    renderPixelArtCanvas();
  }
}

function finishPixelArtStroke() {
  if (!pixelArtEditor.isPointerDown) return;
  pixelArtEditor.isPointerDown = false;
  if (pixelArtEditor.strokeChanged) {
    pushPixelArtHistory(pixelArtEditor.undoStack, pixelArtEditor.strokeSnapshot);
    pixelArtEditor.redoStack = [];
    updatePixelArtDirtyState();
  }
  pixelArtEditor.strokeSnapshot = null;
  pixelArtEditor.strokeChanged = false;
  updatePixelArtControls();
}

function floodFillPixelArt(startIndex) {
  const originalColor = pixelArtEditor.pixels[startIndex];
  const fillColor = pixelArtEditor.selectedColor;
  if (originalColor === fillColor) return false;

  const pending = [startIndex];
  pixelArtEditor.pixels[startIndex] = fillColor;
  while (pending.length) {
    const index = pending.pop();
    const x = index % pixelArtEditor.width;
    const y = Math.floor(index / pixelArtEditor.width);
    const neighbors = [];
    if (x > 0) neighbors.push(index - 1);
    if (x + 1 < pixelArtEditor.width) neighbors.push(index + 1);
    if (y > 0) neighbors.push(index - pixelArtEditor.width);
    if (y + 1 < pixelArtEditor.height) neighbors.push(index + pixelArtEditor.width);
    neighbors.forEach((neighbor) => {
      if (pixelArtEditor.pixels[neighbor] === originalColor) {
        pixelArtEditor.pixels[neighbor] = fillColor;
        pending.push(neighbor);
      }
    });
  }
  return true;
}

function resizePixelArt(nextSize) {
  if (!PIXEL_ART_SIZES.has(nextSize) || nextSize === pixelArtEditor.width) return;
  const previous = snapshotPixelArt();
  const nextPixels = Array(nextSize * nextSize).fill(null);
  for (let y = 0; y < nextSize; y += 1) {
    for (let x = 0; x < nextSize; x += 1) {
      const sourceX = Math.min(previous.width - 1, Math.floor(x * previous.width / nextSize));
      const sourceY = Math.min(previous.height - 1, Math.floor(y * previous.height / nextSize));
      nextPixels[y * nextSize + x] = previous.pixels[sourceY * previous.width + sourceX];
    }
  }
  pushPixelArtHistory(pixelArtEditor.undoStack, previous);
  pixelArtEditor.redoStack = [];
  pixelArtEditor.width = nextSize;
  pixelArtEditor.height = nextSize;
  pixelArtEditor.pixels = nextPixels;
  updatePixelArtDirtyState();
  renderPixelArtCanvas();
  updatePixelArtControls();
}

function undoPixelArt() {
  if (!pixelArtEditor.undoStack.length) return;
  pushPixelArtHistory(pixelArtEditor.redoStack, snapshotPixelArt());
  restorePixelArtSnapshot(pixelArtEditor.undoStack.pop());
  updatePixelArtDirtyState();
}

function redoPixelArt() {
  if (!pixelArtEditor.redoStack.length) return;
  pushPixelArtHistory(pixelArtEditor.undoStack, snapshotPixelArt());
  restorePixelArtSnapshot(pixelArtEditor.redoStack.pop());
  updatePixelArtDirtyState();
}

function clearPixelArt() {
  if (!pixelArtEditor.pixels.some(Boolean)) return;
  if (!window.confirm('Limpar todo o desenho atual?')) return;
  pushPixelArtHistory(pixelArtEditor.undoStack, snapshotPixelArt());
  pixelArtEditor.redoStack = [];
  pixelArtEditor.pixels = Array(pixelArtEditor.width * pixelArtEditor.height).fill(null);
  updatePixelArtDirtyState();
  renderPixelArtCanvas();
  updatePixelArtControls();
}

function togglePixelArtGrid() {
  pixelArtEditor.showGrid = !pixelArtEditor.showGrid;
  renderPixelArtCanvas();
  updatePixelArtControls();
}

function changePixelArtZoom(change) {
  pixelArtEditor.zoom = Math.max(0.75, Math.min(1.75, pixelArtEditor.zoom + change));
  renderPixelArtCanvas();
  updatePixelArtControls();
}

function savePixelArt() {
  const relationship = state.relationships.find((entry) => entry.id === pixelArtEditor.relationshipId);
  if (!relationship) {
    showAppMessage('Não foi possível encontrar a relação deste desenho. O rascunho continua aberto.', 'error');
    return;
  }

  const previousPixelArt = relationship.pixelArt;
  relationship.pixelArt = {
    width: pixelArtEditor.width,
    height: pixelArtEditor.height,
    pixels: pixelArtEditor.pixels.slice(),
  };
  const saved = saveState();
  // Com o armazenamento desativado (dados só nesta sessão), tentar de novo não adianta:
  // o retrato fica na sessão, como as outras alterações. Só a falha de gravação desfaz.
  if (!saved && storageWriteEnabled) {
    if (previousPixelArt === undefined) delete relationship.pixelArt;
    else relationship.pixelArt = previousPixelArt;
    showAppMessage('Não foi possível salvar o desenho no navegador. O retrato anterior foi preservado; libere espaço e tente novamente.', 'error');
    return;
  }

  pixelArtEditor.initialValue = serializePixelArt();
  pixelArtEditor.dirty = false;
  renderRelationships();
  pixelArtDialog.close();
  if (saved) showAppMessage('Retrato salvo na relação.');
}

function requestPixelArtClose() {
  if (pixelArtEditor.dirty && !window.confirm('Descartar as alterações não salvas deste retrato?')) return;
  pixelArtDialog.close();
}

function restorePixelArtFocus() {
  const relationshipId = pixelArtEditor.relationshipId;
  const trigger = pixelArtEditor.returnFocus?.isConnected
    ? pixelArtEditor.returnFocus
    : Array.from(relationshipsList.querySelectorAll('button[data-action="pixel-art"]'))
      .find((button) => button.dataset.id === relationshipId);
  pixelArtEditor.relationshipId = '';
  pixelArtEditor.returnFocus = null;
  if (trigger) trigger.focus();
}

function updateRelationshipAffinityPreview() {
  const affinityType = relationshipForm.querySelector('input[name="relationshipAffinity"]:checked').value;
  const bondType = relationshipBondTypeInput.value;
  const affinityLevel = clampNumber(relationshipAffinityLevelInput.value, 1, 3, 1);
  const bondLabel = bondType === 'romantic' ? 'relação romântica' : 'afinidade comum';
  const polarityLabel = affinityType === 'negative' ? 'negativa' : 'positiva';
  const symbol = bondType === 'romantic' ? '♥' : '●';
  const intensityLabel = bondType === 'romantic'
    ? `${affinityLevel} ${affinityLevel === 1 ? 'coração' : 'corações'}`
    : `${affinityLevel} ${affinityLevel === 1 ? 'bolinha' : 'bolinhas'}`;

  Array.from(relationshipAffinityLevelInput.options).forEach((option, index) => {
    const level = index + 1;
    option.textContent = bondType === 'romantic'
      ? `${level} ${level === 1 ? 'coração' : 'corações'}`
      : `${level} ${level === 1 ? 'bolinha' : 'bolinhas'}`;
  });

  relationshipAffinityPreview.className = `affinity-preview ${bondType} ${affinityType}`;
  relationshipAffinityPreview.textContent = symbol.repeat(affinityLevel);
  relationshipAffinityPreview.setAttribute(
    'aria-label',
    `Prévia: ${bondLabel} ${polarityLabel}, ${intensityLabel}`
  );
}

function bindDiceButtons() {
  document.querySelectorAll('.dice-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const sides = Number(button.dataset.sides || 20);
      const result = getRandomInt(1, sides);
      const label = `d${sides} = ${result}`;

      state.diceHistory.unshift({
        id: generateId(),
        result: label,
        sides,
        value: result,
        timestamp: new Date().toISOString(),
      });

      state.diceHistory = state.diceHistory.slice(0, 12);
      lastRollText.textContent = label;
      saveState();
      renderDiceHistory();
    });
  });
}

function bindDiceHistoryClear() {
  clearDiceHistoryBtn.addEventListener('click', () => {
    state.diceHistory = [];
    lastRollText.textContent = 'Nenhuma';
    const saved = saveState();
    renderDiceHistory();
    if (saved) showAppMessage('Histórico de rolagens limpo.');
  });
}

function bindJournalForm() {
  const reflectionKeys = Object.keys(journalReflectionFields);

  journalList.addEventListener('click', (event) => {
    const deleteButton = event.target instanceof Element
      ? event.target.closest('.journal-delete-btn')
      : null;
    if (deleteButton && journalList.contains(deleteButton)) {
      const entry = state.journal.find((item) => item.id === deleteButton.dataset.id);
      if (!entry) return;
      journalEntryPendingDeleteId = entry.id;
      if (typeof journalDeleteDialog.showModal === 'function') {
        journalDeleteDialog.showModal();
      } else if (window.confirm('Deseja realmente excluir este registro do Diário Psicológico? Esta ação não poderá ser desfeita.')) {
        // Como nas outras listas, a exclusão vale na sessão mesmo se o navegador não salvar;
        // nesse caso o saveState já mostra o aviso de dados não salvos.
        state.journal = state.journal.filter((item) => item.id !== entry.id);
        const saved = saveState();
        renderJournal();
        if (saved) showAppMessage('Registro excluído do Diário Psicológico.');
        journalEntryPendingDeleteId = null;
      }
      return;
    }

    const toggle = event.target instanceof Element
      ? event.target.closest('.journal-reflection-toggle')
      : null;
    if (!toggle || !journalList.contains(toggle)) return;

    const answer = document.getElementById(toggle.getAttribute('aria-controls'));
    if (!answer || !journalList.contains(answer)) return;

    const expanded = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(expanded));
    answer.setAttribute('aria-hidden', String(!expanded));
    answer.toggleAttribute('inert', !expanded);
    toggle.closest('.journal-reflection-entry').classList.toggle('is-expanded', expanded);
  });

  journalEmotionInput.addEventListener('change', () => {
    journalEmotionOtherField.classList.toggle('hidden', journalEmotionInput.value !== 'Outra');
  });

  journalForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const title = journalTitleInput.value.trim();
    const content = journalContentInput.value.trim();
    const tags = normalizeTags(journalTagsInput.value);

    if (!title || !content) {
      return;
    }

    const reflection = {};
    reflectionKeys.forEach((key) => {
      reflection[key] = journalReflectionFields[key].value.trim();
    });

    const novaEntrada = {
      id: generateId(),
      title,
      content,
      tags,
      timestamp: new Date().toISOString(),
      emotion: journalEmotionInput.value,
      emotionOther: journalEmotionOtherInput.value.trim(),
      emotionIntensity: journalEmotionIntensityInput.value
        ? Number(journalEmotionIntensityInput.value)
        : null,
      reflection,
    };
    state.journal.unshift(novaEntrada);

    // Se a busca ou o filtro atual esconderiam a entrada nova, limpa os dois
    // para ela aparecer na lista e não parecer que não foi salva.
    const termoBusca = journalSearchInput.value.trim().toLowerCase();
    if (!matchesJournalEntry(novaEntrada, termoBusca, journalTagFilter.value)) {
      journalSearchInput.value = '';
      journalTagFilter.value = 'all';
    }

    journalForm.reset();
    journalEmotionOtherField.classList.add('hidden');
    const saved = saveState();
    renderJournal();
    if (saved) showAppMessage('Registro adicionado ao diário.');
  });

  journalSearchInput.addEventListener('input', renderJournal);
  journalTagFilter.addEventListener('change', renderJournal);

  journalDeleteCancelBtn.addEventListener('click', () => {
    journalEntryPendingDeleteId = null;
    journalDeleteDialog.close();
  });

  journalDeleteConfirmBtn.addEventListener('click', () => {
    if (!journalEntryPendingDeleteId) return;

    const entryExists = state.journal.some((entry) => entry.id === journalEntryPendingDeleteId);
    if (!entryExists) {
      journalEntryPendingDeleteId = null;
      journalDeleteDialog.close();
      return;
    }

    // Como nas outras listas, a exclusão vale na sessão mesmo se o navegador não salvar;
    // nesse caso o saveState já mostra o aviso de dados não salvos.
    state.journal = state.journal.filter((entry) => entry.id !== journalEntryPendingDeleteId);
    const saved = saveState();
    journalEntryPendingDeleteId = null;
    journalDeleteDialog.close();
    renderJournal();
    if (saved) showAppMessage('Registro excluído do Diário Psicológico.');
  });

  journalDeleteDialog.addEventListener('cancel', () => {
    journalEntryPendingDeleteId = null;
  });
}

function bindThemeToggle() {
  themeToggleBtn.addEventListener('click', () => {
    const nextTheme = document.body.dataset.theme === 'field' ? 'journal' : 'field';
    state.theme = nextTheme;
    document.body.dataset.theme = nextTheme;
    themeToggleBtn.textContent = nextTheme === 'field' ? 'Modo Diário Manuscrito' : 'Modo Ficha de Campo';
    saveState();
  });
}

function bindBackupActions() {
  exportBtn.addEventListener('click', exportBackup);
  importInput.addEventListener('change', handleBackupImport);
}

// O evento "storage" só chega quando OUTRA aba grava a mesma chave.
// Apenas avisa; não recarrega os dados à força para não perder o que está nesta aba.
function bindStorageSync() {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    showAppMessage(
      'Os dados foram alterados em outra aba. Recarregue a página antes de continuar para não sobrescrever essas alterações.',
      'warning'
    );
  });
}

function exportBackup() {
  let url = null;
  try {
    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

    link.href = url;
    link.download = `chronicles-sheet-backup-${stamp}.json`;
    // Navegadores antigos só baixam se o link estiver no documento.
    document.body.appendChild(link);
    link.click();
    link.remove();
    showAppMessage('Backup exportado com sucesso.');
  } catch (error) {
    console.error('Erro ao exportar backup:', error);
    showAppMessage('Não foi possível exportar o backup. Tente novamente.', 'error');
  } finally {
    // Revoga depois, para o download ter tempo de começar.
    if (url) window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

async function handleBackupImport(event) {
  const [file] = event.target.files || [];
  if (!file) return;

  try {
    const text = await file.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error('O arquivo está corrompido ou não contém um JSON válido.');
    }
    validateBackup(parsed);
    const nextState = normalizeState(parsed);
    const saved = saveState(nextState, true);
    Object.keys(state).forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(nextState, key)) delete state[key];
    });
    Object.assign(state, nextState);
    // O item em edição pode não existir no backup: sai do modo de edição e limpa os formulários.
    clearInventoryForm();
    clearArsenalForm();
    clearAttributeForm();
    clearSkillForm();
    clearRelationshipForm();
    journalForm.reset();
    journalEmotionOtherField.classList.add('hidden');
    renderAll();
    const message = saved
      ? 'Backup importado com sucesso!'
      : 'Backup importado nesta sessão, mas não foi possível salvá-lo no navegador. Exporte uma cópia para não perder os dados.';
    showAppMessage(message, saved ? 'success' : 'warning');
  } catch (error) {
    console.error('Erro ao importar backup:', error);
    showAppMessage(
      `Não foi possível importar o backup. ${error.message || 'Verifique o arquivo e tente novamente.'} Os dados atuais foram mantidos.`,
      'error'
    );
  } finally {
    importInput.value = '';
  }
}

// Um backup deste site tem o objeto "character" ou pelo menos uma das listas.
function validateBackup(data) {
  if (!isPlainObject(data)) {
    throw new Error('A estrutura do arquivo deve ser um objeto JSON.');
  }

  const listKeys = ['inventory', 'arsenal', 'journal', 'diceHistory', 'relationships', 'skills'];
  const hasRecognizedData = isPlainObject(data.character) || listKeys.some((key) => Array.isArray(data[key]));
  if (!hasRecognizedData) {
    throw new Error('O arquivo não contém dados reconhecidos do Chronicles & Sheet.');
  }

  if (data.character !== undefined && !isPlainObject(data.character)) {
    throw new Error('A ficha do personagem está em formato inválido.');
  }
  if (data.theme !== undefined && !['field', 'journal'].includes(data.theme)) {
    throw new Error('O tema do backup é inválido ou incompatível.');
  }
  if (data.attributesHidden !== undefined && typeof data.attributesHidden !== 'boolean') {
    throw new Error('A preferência de atributos ocultos é inválida.');
  }

  validateCharacterBackup(data.character);
  validateBackupLists(data, listKeys);
}

function validateCharacterBackup(character) {
  if (character === undefined) return;
  if (!isPlainObject(character)) {
    throw new Error('A ficha do personagem está em formato inválido.');
  }

  ['name', 'className', 'notes'].forEach((key) => {
    if (character[key] !== undefined && typeof character[key] !== 'string' && typeof character[key] !== 'number') {
      throw new Error(`O campo "${key}" do personagem é inválido.`);
    }
  });
  if (character.level !== undefined && !isBackupNumber(character.level)) {
    throw new Error('O nível do personagem é inválido.');
  }
  ['hp', 'sanity', 'effort'].forEach((key) => {
    if (character[key] !== undefined && character[key] !== null && !isPlainObject(character[key])) {
      throw new Error(`Os dados de ${key} estão em formato inválido.`);
    }
    if (isPlainObject(character[key])) {
      ['current', 'max'].forEach((field) => {
        if (character[key][field] !== undefined && !isBackupNumber(character[key][field])) {
          throw new Error(`O campo "${field}" de ${key} é inválido.`);
        }
      });
    }
  });
  if (Array.isArray(character.attributes)) {
    character.attributes.forEach(validateAttributeBackupItem);
  } else if (character.attributes !== undefined && character.attributes !== null && !isPlainObject(character.attributes)) {
    throw new Error('Os atributos do personagem estão em formato inválido.');
  } else if (isPlainObject(character.attributes)) {
    Object.entries(character.attributes).forEach(([key, value]) => {
      if (!isBackupNumber(value)) throw new Error(`O atributo "${key}" é inválido.`);
    });
  }
}

function validateBackupLists(data, listKeys) {
  listKeys.forEach((key) => {
    if (data[key] !== undefined && !Array.isArray(data[key])) {
      throw new Error(`A lista "${key}" está em formato inválido.`);
    }
  });
  (data.inventory || []).forEach(validateInventoryBackupItem);
  (data.arsenal || []).forEach(validateWeaponBackupItem);
  (data.relationships || []).forEach(validateRelationshipBackupItem);
  (data.skills || []).forEach(validateSkillBackupItem);
  (data.diceHistory || []).forEach(validateDiceBackupEntry);
  (data.journal || []).forEach(validateJournalBackupEntry);
}

function validateAttributeBackupItem(attribute) {
  if (!isPlainObject(attribute) || typeof attribute.name !== 'string' || !attribute.name.trim() ||
    (attribute.id !== undefined && typeof attribute.id !== 'string') || !isBackupNumber(attribute.value)) {
    throw new Error('Um atributo está incompleto ou inválido.');
  }
}

function validateDiceBackupEntry(entry) {
  if (!isPlainObject(entry) || typeof entry.result !== 'string' || !entry.result.trim()) {
    throw new Error('Uma rolagem do histórico está incompleta ou inválida.');
  }
  if (entry.sides !== undefined && entry.sides !== null &&
    (!isBackupNumber(entry.sides) || !Number.isInteger(Number(entry.sides)) || Number(entry.sides) < 1)) {
    throw new Error('O tipo de dado de uma rolagem é inválido.');
  }
  if (entry.value !== undefined && entry.value !== null &&
    (!isBackupNumber(entry.value) || !Number.isInteger(Number(entry.value)) || Number(entry.value) < 1)) {
    throw new Error('O resultado de uma rolagem é inválido.');
  }
  if (entry.sides !== undefined && entry.sides !== null && entry.value !== undefined && entry.value !== null &&
    Number(entry.value) > Number(entry.sides)) {
    throw new Error('O resultado de uma rolagem excede o dado informado.');
  }
}

function validateSkillBackupItem(skill) {
  if (!isPlainObject(skill) || typeof skill.name !== 'string' || !skill.name.trim()) {
    throw new Error('Uma perícia precisa de um nome válido.');
  }
  if (skill.id !== undefined && typeof skill.id !== 'string') {
    throw new Error('O identificador de uma perícia é inválido.');
  }
  if (skill.attributeId !== undefined && typeof skill.attributeId !== 'string') {
    throw new Error('O atributo associado a uma perícia é inválido.');
  }
  if (skill.attributeIds !== undefined &&
    (!Array.isArray(skill.attributeIds) || skill.attributeIds.some((id) => typeof id !== 'string'))) {
    throw new Error('A lista de atributos associados a uma perícia é inválida.');
  }
  if (skill.bonus !== undefined && !isBackupNumber(skill.bonus)) {
    throw new Error('O bônus de uma perícia é inválido.');
  }
  ['training', 'others'].forEach((key) => {
    const value = skill[key];
    if (value !== undefined && typeof value !== 'string' &&
      (typeof value !== 'number' || !Number.isFinite(value))) {
      throw new Error(`O campo "${key}" de uma perícia é inválido.`);
    }
  });
}

function validateInventoryBackupItem(item) {
  if (!isPlainObject(item) || typeof item.name !== 'string' || !item.name.trim()) {
    throw new Error('Um item do inventário está incompleto ou inválido.');
  }
  if (item.quantity !== undefined && !isBackupNumber(item.quantity)) {
    throw new Error('A quantidade de um item do inventário é inválida.');
  }
  if (item.description !== undefined && typeof item.description !== 'string') {
    throw new Error('A descrição de um item do inventário é inválida.');
  }
}

function validateWeaponBackupItem(weapon) {
  if (!isPlainObject(weapon) || typeof weapon.name !== 'string' || !weapon.name.trim()) {
    throw new Error('Uma arma do Arsenal precisa de um nome válido.');
  }
  if (weapon.id !== undefined && typeof weapon.id !== 'string') {
    throw new Error('O identificador de uma arma é inválido.');
  }
  const quantity = Number(weapon.quantity);
  if (!isBackupNumber(weapon.quantity) || !Number.isInteger(quantity) || quantity < 1) {
    throw new Error('A quantidade de uma arma deve ser um número inteiro positivo.');
  }
  if (typeof weapon.damage !== 'string' || !weapon.damage.trim()) {
    throw new Error('A expressão de dano de uma arma é obrigatória.');
  }
  if (weapon.description !== undefined && typeof weapon.description !== 'string') {
    throw new Error('A descrição de uma arma é inválida.');
  }
}

function validateRelationshipBackupItem(item) {
  if (!isPlainObject(item) || typeof item.name !== 'string' || !item.name.trim() ||
    typeof item.identification !== 'string' || !item.identification.trim()) {
    throw new Error('Uma relação precisa de nome e identificação.');
  }
  if (item.bondType !== undefined && !RELATIONSHIP_BOND_TYPES.includes(item.bondType)) {
    throw new Error('O tipo de vínculo de uma relação é inválido.');
  }
  if (item.affinityType !== undefined && !['positive', 'negative'].includes(item.affinityType)) {
    throw new Error('A natureza da afinidade de uma relação é inválida.');
  }
  if (item.affinityLevel !== undefined &&
    (!isBackupNumber(item.affinityLevel) || !Number.isInteger(Number(item.affinityLevel)) ||
      Number(item.affinityLevel) < 1 || Number(item.affinityLevel) > 3)) {
    throw new Error('A intensidade da afinidade deve estar entre 1 e 3.');
  }
  if (item.description !== undefined && typeof item.description !== 'string') {
    throw new Error('A descrição de uma relação é inválida.');
  }
  if (item.pixelArt !== undefined && item.pixelArt !== null && !normalizePixelArt(item.pixelArt)) {
    throw new Error('O desenho em pixel art de uma relação está em formato inválido.');
  }
}

function validateJournalBackupEntry(entry) {
  if (!isPlainObject(entry) || typeof entry.title !== 'string' || !entry.title.trim() ||
    typeof entry.content !== 'string' || !entry.content.trim()) {
    throw new Error('Uma entrada do diário está incompleta ou inválida.');
  }
  if (entry.tags !== undefined && typeof entry.tags !== 'string' &&
    (!Array.isArray(entry.tags) || entry.tags.some((tag) => typeof tag !== 'string'))) {
    throw new Error('As tags de uma entrada do diário estão em formato inválido.');
  }
  if (entry.emotion !== undefined && typeof entry.emotion !== 'string') {
    throw new Error('A emoção de uma entrada do diário é inválida.');
  }
  if (entry.emotionOther !== undefined && typeof entry.emotionOther !== 'string') {
    throw new Error('A descrição da emoção é inválida.');
  }
  if (entry.emotionIntensity !== undefined && entry.emotionIntensity !== null && entry.emotionIntensity !== '' &&
    (!isBackupNumber(entry.emotionIntensity) || Number(entry.emotionIntensity) < 1 ||
      Number(entry.emotionIntensity) > 5)) {
    throw new Error('A intensidade emocional deve estar entre 1 e 5.');
  }
  if (entry.reflection !== undefined && !isPlainObject(entry.reflection)) {
    throw new Error('A reflexão psicológica de uma entrada está em formato inválido.');
  }
  if (isPlainObject(entry.reflection)) {
    ['thoughts', 'feelings', 'fears', 'desires', 'innerConflict', 'relationships', 'learning', 'worldview']
      .forEach((key) => {
        if (entry.reflection[key] !== undefined && typeof entry.reflection[key] !== 'string') {
          throw new Error(`O campo "${key}" da reflexão psicológica é inválido.`);
        }
      });
  }
}

function isBackupNumber(value) {
  return value === null || value === '' ||
    (typeof value !== 'boolean' && Number.isFinite(Number(value)));
}

function renderAll() {
  renderTheme();
  renderCharacterBlock();
  renderAttributes();
  renderHp();
  renderSanity();
  renderEffort();
  renderSkills();
  renderInventory();
  renderArsenal();
  renderRelationships();
  renderDiceHistory();
  renderJournal();
}

function renderTheme() {
  const theme = state.theme || 'field';
  document.body.dataset.theme = theme;
  themeToggleBtn.textContent = theme === 'field' ? 'Modo Diário Manuscrito' : 'Modo Ficha de Campo';
}

function renderCharacterBlock() {
  characterFields.name.value = state.character.name;
  characterFields.className.value = state.character.className;
  characterFields.level.value = state.character.level;
  characterFields.notes.value = state.character.notes;
}

function renderAttributes() {
  attributesGrid.innerHTML = '';
  state.character.attributes.forEach((attribute) => {
    const card = document.createElement('div');
    const safeName = escapeHtml(attribute.name);
    card.className = 'attribute';
    // dataset não interpreta HTML: o id vai sem escape para continuar igual ao do state.
    card.dataset.attributeId = attribute.id;
    card.innerHTML = `
      <label class="attribute-name-field">
        <span class="sr-only">Nome do atributo</span>
        <input type="text" data-attribute-name value="${safeName}" aria-label="Nome do atributo ${safeName}" required />
      </label>
      <label class="attribute-value-field">
        <span class="sr-only">Valor de ${safeName}</span>
        <input type="number" step="any" data-attribute-value value="${escapeHtml(String(attribute.value))}" aria-label="Valor de ${safeName}" />
      </label>
    `;
    attributesGrid.appendChild(card);
  });

  const hidden = Boolean(state.attributesHidden);
  attributesGrid.classList.toggle('hidden', hidden);
  toggleAttributesBtn.textContent = hidden ? 'Mostrar' : 'Ocultar';
  toggleAttributesBtn.setAttribute('aria-label', hidden ? 'Mostrar atributos' : 'Ocultar atributos');
  toggleAttributesBtn.setAttribute('aria-expanded', String(!hidden));
}

function renderSkills() {
  const selectedAttributes = Array.from(skillAttributeInput.selectedOptions)
    .map((option) => option.value);
  skillAttributeInput.innerHTML =
    state.character.attributes.map((attribute) =>
      `<option value="${escapeHtml(attribute.id)}">${escapeHtml(attribute.name)}</option>`
    ).join('');
  Array.from(skillAttributeInput.options).forEach((option) => {
    option.selected = selectedAttributes.includes(option.value);
  });

  skillsList.innerHTML = '';
  if (!state.skills.length) {
    skillsList.innerHTML = '<tr><td class="empty-state" colspan="6">Nenhuma perícia cadastrada.</td></tr>';
    return;
  }

  [...state.skills]
    .sort((first, second) => SKILL_COLLATOR.compare(first.name, second.name))
    .forEach((skill) => {
      const attributeNames = skill.attributeIds
        .map((id) => state.character.attributes.find((entry) => entry.id === id)?.name)
        .filter(Boolean);
      const row = document.createElement('tr');
      const name = escapeHtml(skill.name);
      row.className = 'skill-row';
      row.innerHTML = `
        <td data-label="Perícia"><strong>${name}</strong></td>
        <td data-label="Dados / Atributo">${escapeHtml(attributeNames.join(' / ') || '—')}</td>
        <td data-label="Bônus">${escapeHtml(String(skill.bonus))}</td>
        <td data-label="Treino">${escapeHtml(skill.training || '—')}</td>
        <td data-label="Outros">${escapeHtml(skill.others || '—')}</td>
        <td data-label="Ações">
          <div class="skill-actions">
            <button type="button" data-action="edit" data-id="${escapeHtml(skill.id)}" aria-label="Editar perícia ${name}">Editar</button>
            <button type="button" data-action="delete" data-id="${escapeHtml(skill.id)}" aria-label="Remover perícia ${name}">Remover</button>
          </div>
        </td>
      `;
      skillsList.appendChild(row);
    });
}

function renderHp(preserveCurrentInput = false) {
  const max = Number(state.character.hp.max || 1);
  const current = Number(state.character.hp.current || 0);
  const typedCurrent = preserveCurrentInput ? hpElements.currentInput.value : '';
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  const critical = current <= 0 || percentage < 25;

  updateProgressBar(hpElements.bar, current, max, percentage, critical);
  hpElements.currentText.textContent = current;
  hpElements.currentInput.value = current;
  hpElements.currentInput.max = max;
  if (preserveCurrentInput && typedCurrent !== '') hpElements.currentInput.value = typedCurrent;
  hpElements.maxInput.value = max;

  updateVitalStatus('hp', hpElements.status, current, percentage);
}

function renderSanity(preserveCurrentInput = false) {
  const max = Number(state.character.sanity?.max || 1);
  const current = Number(state.character.sanity?.current || 0);
  const typedCurrent = preserveCurrentInput ? sanityElements.currentInput.value : '';
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  const critical = current <= 0 || percentage < 25;

  updateProgressBar(sanityElements.bar, current, max, percentage, critical);
  sanityElements.currentText.textContent = current;
  sanityElements.currentInput.value = current;
  sanityElements.currentInput.max = max;
  if (preserveCurrentInput && typedCurrent !== '') sanityElements.currentInput.value = typedCurrent;
  sanityElements.maxInput.value = max;

  updateVitalStatus('sanity', sanityElements.status, current, percentage);
}

function renderEffort(preserveCurrentInput = false) {
  const max = Number(state.character.effort?.max || 1);
  const current = Number(state.character.effort?.current || 0);
  const typedCurrent = preserveCurrentInput ? effortElements.currentInput.value : '';
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  const critical = current <= 0 || percentage < 25;

  updateProgressBar(effortElements.bar, current, max, percentage, critical);
  effortElements.currentText.textContent = current;
  effortElements.currentInput.value = current;
  effortElements.currentInput.max = max;
  if (preserveCurrentInput && typedCurrent !== '') effortElements.currentInput.value = typedCurrent;
  effortElements.maxInput.value = max;

  updateVitalStatus('effort', effortElements.status, current, percentage);
}

function updateVitalStatus(key, status, current, percentage) {
  const messages = {
    hp: [
      'HP zerado. O personagem caiu e precisa de atenção imediata.',
      'HP crítico! O personagem está em risco iminente.',
      'HP está estável.',
    ],
    sanity: [
      'Sanidade está instável. O personagem está muito afetado.',
      'Sanidade está instável. O personagem está próximo do limite.',
      'Sanidade está estável.',
    ],
    effort: [
      'Esforço está instável. Sem pontos disponíveis.',
      'Esforço está instável. Reserve energia para momentos críticos.',
      'Esforço está estável.',
    ],
  };
  const severity = current <= 0 ? 0 : percentage < 25 ? 1 : 2;
  const classes = ['critical', 'warning', 'safe'];
  status.textContent = messages[key][severity];
  status.className = `hp-status ${classes[severity]}`;
}

function updateProgressBar(bar, current, max, percentage, critical) {
  bar.style.width = `${percentage}%`;
  bar.classList.toggle('critical', critical);
  bar.setAttribute('aria-valuenow', current);
  bar.setAttribute('aria-valuemax', max);
  bar.setAttribute('aria-valuetext', `${current} de ${max}`);
}

function renderInventory() {
  inventoryList.innerHTML = '';

  if (!state.inventory.length) {
    inventoryList.innerHTML = '<li class="empty-state">Nenhum item no inventário. Adicione o primeiro item.</li>';
    return;
  }

  state.inventory.forEach((item) => {
    const listItem = document.createElement('li');
    listItem.className = 'inventory-item';

    listItem.innerHTML = `
      <div class="item-main">
        <div class="item-name">
          <span>${escapeHtml(item.name)}</span>
          <span class="item-tag"><span class="item-quantity-prefix">x</span>${escapeHtml(String(item.quantity))}</span>
        </div>
        <p class="item-desc field-only">${escapeHtml(item.description || 'Sem descrição.')}</p>
      </div>
      <div class="item-actions">
        <button type="button" data-action="edit" data-id="${escapeHtml(item.id)}" aria-label="Editar ${escapeHtml(item.name)}">Editar</button>
        <button type="button" data-action="delete" data-id="${escapeHtml(item.id)}" aria-label="Remover ${escapeHtml(item.name)}">Remover</button>
      </div>
    `;

    inventoryList.appendChild(listItem);
  });

}

function renderArsenal() {
  arsenalList.innerHTML = '';
  journalArsenalList.innerHTML = '';

  if (!state.arsenal.length) {
    arsenalList.innerHTML = `
      <tr class="arsenal-empty-row">
        <td colspan="5"><p class="empty-state">Nenhuma arma cadastrada no Arsenal.</p></td>
      </tr>
    `;
    journalArsenalList.innerHTML = '<li class="empty-state">Nenhuma arma cadastrada no Arsenal.</li>';
    return;
  }

  state.arsenal.forEach((weapon) => {
    const row = document.createElement('tr');
    const name = escapeHtml(weapon.name);
    row.className = 'arsenal-row';
    row.innerHTML = `
      <td data-label="Arma"><strong>${name}</strong></td>
      <td data-label="Dano"><span class="arsenal-damage">${escapeHtml(weapon.damage)}</span></td>
      <td data-label="Quantidade"><span class="arsenal-quantity">×${escapeHtml(String(weapon.quantity))}</span></td>
      <td class="field-only" data-label="Descrição">${escapeHtml(weapon.description || '—')}</td>
      <td data-label="Ações">
        <div class="arsenal-actions">
          <button type="button" data-action="edit" data-id="${escapeHtml(weapon.id)}" aria-label="Editar arma ${name}">Editar</button>
          <button type="button" data-action="delete" data-id="${escapeHtml(weapon.id)}" aria-label="Remover arma ${name}">Remover</button>
        </div>
      </td>
    `;
    arsenalList.appendChild(row);

    const journalItem = document.createElement('li');
    journalItem.className = 'journal-arsenal-item';
    journalItem.innerHTML = `
      <div class="journal-arsenal-main">
        <strong class="journal-arsenal-name">${name}</strong>
        <span class="journal-arsenal-damage">Dano: ${escapeHtml(weapon.damage)}</span>
        <span class="journal-arsenal-quantity">Quantidade: ×${escapeHtml(String(weapon.quantity))}</span>
      </div>
      <div class="arsenal-actions">
        <button type="button" data-action="edit" data-id="${escapeHtml(weapon.id)}" aria-label="Editar arma ${name}">Editar</button>
        <button type="button" data-action="delete" data-id="${escapeHtml(weapon.id)}" aria-label="Remover arma ${name}">Remover</button>
      </div>
    `;
    journalArsenalList.appendChild(journalItem);
  });
}

function renderRelationships() {
  relationshipsList.innerHTML = '';

  if (!state.relationships.length) {
    relationshipsList.innerHTML = `
      <tr class="relationship-empty-row">
        <td colspan="5"><p class="empty-state">Nenhuma relação registrada ainda.</p></td>
      </tr>
    `;
    return;
  }

  state.relationships.forEach((relationship) => {
    const row = document.createElement('tr');
    const name = escapeHtml(relationship.name);
    const hasPixelArt = Boolean(normalizePixelArt(relationship.pixelArt));
    row.className = 'relationship-row';
    row.innerHTML = `
      <td data-label="Nome">
        <div class="relationship-person">
          <button class="relationship-pixel-art-trigger${hasPixelArt ? ' has-pixel-art' : ''}" type="button" data-action="pixel-art" data-id="${escapeHtml(relationship.id)}" aria-label="Desenhar retrato de ${name}" title="Desenhar retrato de ${name}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16.5-.8 4.3 4.3-.8L20 7.5 16.5 4 4 16.5Z"></path><path d="m14.8 5.7 3.5 3.5M4 20.8l3.5-.8"></path></svg>
          </button>
          <strong>${name}</strong>
          ${hasPixelArt ? `<canvas class="relationship-pixel-preview" width="${relationship.pixelArt.width}" height="${relationship.pixelArt.height}" role="img" aria-label="Retrato em pixel art de ${name}"></canvas>` : ''}
        </div>
      </td>
      <td data-label="Identificação">${escapeHtml(relationship.identification)}</td>
      <td data-label="Vínculo">${renderAffinity(relationship)}</td>
      <td data-label="Descrição">${escapeHtml(relationship.description || '—')}</td>
      <td data-label="Ações">
        <div class="relationship-actions">
          <button type="button" data-action="edit" data-id="${escapeHtml(relationship.id)}" aria-label="Editar relação com ${name}">Editar</button>
          <button type="button" data-action="delete" data-id="${escapeHtml(relationship.id)}" aria-label="Remover relação com ${name}">Remover</button>
        </div>
      </td>
    `;
    relationshipsList.appendChild(row);
    if (hasPixelArt) {
      drawPixelArtPreview(row.querySelector('.relationship-pixel-preview'), relationship.pixelArt);
    }
  });
}

function drawPixelArtPreview(canvas, pixelArt) {
  const context = canvas.getContext('2d');
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, pixelArt.width, pixelArt.height);
  pixelArt.pixels.forEach((color, index) => {
    if (!color) return;
    context.fillStyle = color;
    context.fillRect(index % pixelArt.width, Math.floor(index / pixelArt.width), 1, 1);
  });
}

function renderAffinity(relationship) {
  const bondType = relationship.bondType;
  const affinityType = relationship.affinityType;
  const affinityLevel = clampNumber(relationship.affinityLevel, 1, 3, 1);
  const bondLabel = bondType === 'romantic' ? 'Relação romântica' : 'Afinidade comum';
  const polarityLabel = affinityType === 'negative' ? 'negativa' : 'positiva';
  const symbol = bondType === 'romantic' ? '♥' : '●';

  return `<span class="affinity-indicator ${bondType} ${affinityType}" role="img" aria-label="${bondLabel} ${polarityLabel}, intensidade ${affinityLevel} de 3">${symbol.repeat(affinityLevel)}</span>`;
}

function clearInventoryForm() {
  inventoryForm.reset();
  inventoryIdInput.value = '';
  itemQtyInput.value = 1;
  cancelEditBtn.classList.add('hidden');
  saveItemBtn.textContent = 'Adicionar item';
}

function clearArsenalForm() {
  arsenalForm.reset();
  arsenalIdInput.value = '';
  weaponQuantityInput.value = 1;
  saveWeaponBtn.textContent = 'Adicionar arma';
  cancelWeaponEditBtn.classList.add('hidden');
}

function renderDiceHistory() {
  diceHistoryList.innerHTML = '';

  if (!state.diceHistory.length) {
    diceHistoryList.innerHTML = '<tr><td class="empty-state" colspan="3">Nenhuma rolagem registrada ainda.</td></tr>';
    // Sem histórico (ex.: depois de importar um backup sem rolagens), não mostra a rolagem antiga.
    lastRollText.textContent = 'Nenhuma';
    return;
  }

  state.diceHistory.forEach((entry, index) => {
    const item = document.createElement('tr');
    const parsedRoll = parseRollResult(entry.result);
    const sides = Number.isInteger(entry.sides) && entry.sides > 0
      ? entry.sides
      : parsedRoll?.sides;
    const value = Number.isFinite(entry.value) && entry.value !== null
      ? entry.value
      : parsedRoll?.value;
    const dateTime = formatRollDate(entry.timestamp);
    item.className = `dice-history-item${index === 0 ? ' latest-roll' : ''}`;
    item.innerHTML = `
      <td data-label="Dado"><span class="roll-die">${sides ? `d${sides}` : 'Dado'}</span></td>
      <td data-label="Resultado"><strong class="roll-result">${value === undefined ? escapeHtml(entry.result) : escapeHtml(String(value))}</strong></td>
      <td data-label="Data e horário"><time class="roll-time"${entry.timestamp ? ` datetime="${escapeHtml(entry.timestamp)}"` : ''}>${escapeHtml(dateTime)}</time></td>
    `;

    diceHistoryList.appendChild(item);
  });

  if (state.diceHistory[0]) {
    lastRollText.textContent = state.diceHistory[0].result;
  } else {
    lastRollText.textContent = 'Nenhuma';
  }
}

function formatRollDate(timestamp) {
  if (!timestamp || Number.isNaN(new Date(timestamp).getTime())) return 'Sem data';
  const date = new Date(timestamp);
  const dateLabel = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
  const timeLabel = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
  return `${dateLabel} - ${timeLabel}`;
}

function renderJournal() {
  const searchTerm = journalSearchInput.value.trim().toLowerCase();
  const tagFilter = journalTagFilter.value;
  const filteredEntries = state.journal.filter((entry) =>
    matchesJournalEntry(entry, searchTerm, tagFilter)
  );

  // #combate e #Combate viram uma opção só; fica a primeira grafia encontrada.
  const tagsPorChave = new Map();
  state.journal.flatMap((entry) => entry.tags).forEach((tag) => {
    if (!tagsPorChave.has(chaveTag(tag))) tagsPorChave.set(chaveTag(tag), tag);
  });
  const allTags = Array.from(tagsPorChave.values()).sort();
  const currentValue = journalTagFilter.value;
  journalTagFilter.innerHTML = '<option value="all">Todas</option>' +
    allTags.map((tag) => `<option value="${escapeHtml(tag)}">${escapeHtml(tag)}</option>`).join('');

  const tagSelecionada = currentValue && currentValue !== 'all'
    ? tagsPorChave.get(chaveTag(currentValue))
    : undefined;
  if (tagSelecionada) {
    journalTagFilter.value = tagSelecionada;
  } else {
    journalTagFilter.value = 'all';
  }

  journalList.innerHTML = '';

  if (!filteredEntries.length) {
    journalList.innerHTML = '<li class="empty-state">Nenhuma anotação encontrada para o filtro atual.</li>';
    return;
  }

  filteredEntries.forEach((entry, index) => journalList.appendChild(renderJournalEntry(entry, index)));
}

function matchesJournalEntry(entry, searchTerm, tagFilter) {
  const reflectionText = Object.values(entry.reflection || {})
    .filter((value) => typeof value === 'string')
    .join(' ')
    .toLowerCase();
  const matchesSearch = !searchTerm ||
    entry.title.toLowerCase().includes(searchTerm) ||
    entry.content.toLowerCase().includes(searchTerm) ||
    entry.tags.some((tag) => tag.toLowerCase().includes(searchTerm)) ||
    entry.emotion.toLowerCase().includes(searchTerm) ||
    entry.emotionOther.toLowerCase().includes(searchTerm) ||
    reflectionText.includes(searchTerm);

  return matchesSearch &&
    (tagFilter === 'all' || entry.tags.some((tag) => chaveTag(tag) === chaveTag(tagFilter)));
}

// Chave usada para comparar tags sem diferenciar maiúsculas; a tag salva não muda.
function chaveTag(tag) {
  return tag.toLocaleLowerCase('pt-BR');
}

function renderJournalEntry(entry, entryIndex) {
  const item = document.createElement('li');
  item.className = 'journal-item';

  const emotion = entry.emotion === 'Outra' && entry.emotionOther
    ? `Outra: ${entry.emotionOther}`
    : entry.emotion;
  const emotionalState = emotion || entry.emotionIntensity
    ? `<div class="journal-emotion">
        <span class="journal-emotion-label">Emoção predominante</span>
        <strong class="journal-emotion-value">${emotion ? escapeHtml(emotion) : 'Não informada'}</strong>
        ${renderEmotionIntensity(entry.emotionIntensity)}
      </div>`
    : '';
  const tags = entry.tags.length
    ? `<div class="journal-tags">
        ${entry.tags.map((tag) => `<span class="tag-pill">${escapeHtml(tag)}</span>`).join('')}
      </div>`
    : '';
  const reflection = Object.entries(journalReflectionLabels)
    .filter(([key]) => entry.reflection && typeof entry.reflection[key] === 'string' &&
      entry.reflection[key].trim())
    .map(([key, label]) => `
      <div class="journal-reflection-entry">
        <button
          class="journal-reflection-toggle"
          type="button"
          aria-expanded="false"
          aria-controls="journal-reflection-answer-${entryIndex}-${key}"
        >
          <strong>${escapeHtml(label)}</strong>
          <span class="journal-reflection-chevron" aria-hidden="true">▼</span>
        </button>
        <div
          id="journal-reflection-answer-${entryIndex}-${key}"
          class="journal-reflection-answer"
          aria-hidden="true"
          inert
        >
          <div class="journal-reflection-answer-inner">
            <p>${escapeHtml(entry.reflection[key])}</p>
          </div>
        </div>
      </div>
    `)
    .join('');

  item.innerHTML = `
    <div class="journal-header">
      <span class="journal-title">${escapeHtml(entry.title)}</span>
      <div class="journal-header-actions">
        <span class="roll-time">${formatDate(entry.timestamp)}</span>
        <button
          class="journal-delete-btn"
          type="button"
          data-action="delete"
          data-id="${escapeHtml(entry.id)}"
          aria-label="Excluir registro ${escapeHtml(entry.title)}"
          title="Excluir registro"
        >🗑</button>
      </div>
    </div>
    ${tags}
    <div class="journal-event">
      <strong class="journal-event-label">Acontecimento</strong>
      <p class="journal-content">${escapeHtml(entry.content)}</p>
    </div>
    ${emotionalState}
    ${reflection ? `<div class="journal-reflection-entries">${reflection}</div>` : ''}
  `;
  return item;
}

function renderEmotionIntensity(intensity) {
  if (!intensity) return '';

  const levels = [1, 2, 3, 4, 5].map((level) =>
    `<span class="${level <= intensity ? 'active' : ''}"></span>`
  ).join('');
  return `
    <span class="journal-emotion-intensity">
      Intensidade <strong>${intensity}/5</strong>
      <span class="journal-intensity-meter" aria-hidden="true">${levels}</span>
    </span>
  `;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function normalizeTags(rawValue) {
  if (!rawValue) return [];
  const values = rawValue
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => {
      const normalized = tag.startsWith('#') ? tag : `#${tag}`;
      return normalized.replace(/\s+/g, '');
    });

  // Na mesma entrada, #combate e #Combate contam como uma tag só (fica a primeira grafia).
  return values
    .filter((tag, index) => values.findIndex((other) => chaveTag(other) === chaveTag(tag)) === index)
    .slice(0, 6);
}

function formatDate(value) {
  if (!value) return 'Sem data';
  const date = new Date(value);
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
})();
