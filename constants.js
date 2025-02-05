const CONSTANTS = {
  LOCATION_PATTERNS: {
    US: {
      name: 'United States',
      allowed: ['united states', 'usa', 'us', 'u.s.', 'u.s.a.', 'american'],
      filter: [
        'canada', 'canadian', 'vancouver', 'toronto', 'montreal', 'calgary', 'ottawa',
        'british columbia', 'ontario', 'quebec', 'alberta', 'manitoba',
        'uk', 'united kingdom', 'london', 'manchester', 'birmingham', 'leeds', 'glasgow',
        'england', 'scotland', 'wales', 'northern ireland', 'british',
        'australia', 'australian', 'sydney', 'melbourne',
        'new zealand', 'wellington', 'auckland',
        'european union', 'eu', 'europe',
        'brazil', 'argentina', 'mexico', 'chile', 'colombia', 'peru'
      ]
    },
    CA: {
      name: 'Canada',
      allowed: ['canada', 'canadian'],
      filter: ['united states', 'usa', 'us', 'uk', 'united kingdom', 'australia', 'new zealand', 'european union',
               'brazil', 'argentina', 'mexico', 'chile', 'colombia', 'peru']
    },
    UK: {
      name: 'United Kingdom',
      allowed: ['uk', 'united kingdom', 'england', 'scotland', 'wales', 'northern ireland', 'british'],
      filter: ['canada', 'united states', 'usa', 'australia', 'new zealand', 'european union',
               'brazil', 'argentina', 'mexico', 'chile', 'colombia', 'peru']
    },
    AU: {
      name: 'Australia',
      allowed: ['australia', 'australian'],
      filter: ['canada', 'united states', 'usa', 'uk', 'united kingdom', 'new zealand', 'european union',
               'brazil', 'argentina', 'mexico', 'chile', 'colombia', 'peru']
    },
    NZ: {
      name: 'New Zealand',
      allowed: ['new zealand', 'nz'],
      filter: ['canada', 'united states', 'usa', 'uk', 'united kingdom', 'australia', 'european union',
               'brazil', 'argentina', 'mexico', 'chile', 'colombia', 'peru']
    },
    EU: {
      name: 'European Union',
      allowed: ['european union', 'eu', 'europe'],
      filter: ['canada', 'united states', 'usa', 'uk', 'united kingdom', 'australia', 'new zealand',
               'brazil', 'argentina', 'mexico', 'chile', 'colombia', 'peru']
    },
    LATAM: {
      name: 'Latin America',
      allowed: [
        'latin america', 'latam', 'brazil', 'brasil', 'argentina', 'mexico', 'méxico',
        'chile', 'colombia', 'peru', 'perú', 'uruguay', 'paraguay', 'bolivia',
        'venezuela', 'ecuador', 'panama', 'costa rica', 'guatemala', 'el salvador',
        'honduras', 'nicaragua', 'dominican republic', 'república dominicana'
      ],
      filter: ['canada', 'united states', 'usa', 'uk', 'united kingdom', 'australia', 'new zealand', 'european union']
    }
  },
  LOCATION_PHRASES: [
    'based in',
    'located in',
    'position in',
    'role in',
    'working in',
    'work in',
    'position is in',
    'job is in',
    'based out of',
    'relocate to',
    'must be in',
    'must live in',
    'must reside in',
    'position is based',
    'role is based',
    'job based',
    'work from',
    'working from'
  ],

  JOB_INDICATORS: [
    'we\'re hiring', 'is hiring', 'job opening', 'open position',
    'new role', 'join our team', 'apply now', 'view job',
    'job opportunity', 'position available', 'submit your application',
    'apply here', 'job description', 'compensation:', 'responsibilities:',
    'qualifications:', 'requirements:', 'full-time', 'part-time', 'hybrid',
    'apply by', 'position summary', 'career opportunity'
  ],

  POST_SELECTORS: [
    '.feed-shared-update-v2',
    '.jobs-job-card',
    '.job-card-container',
    '.jobs-search-results__list-item',
    '.update-components-actor',
    '.feed-shared-article',
    '.discovery-templates-entity-item',
    'li.jobs-search-results__list-item',
    '.jobs-home-vertical-list__entity-list > li'
  ].join(','),

  CONTENT_SELECTORS: [
    '.feed-shared-update-v2__description-wrapper',
    '.feed-shared-article__description-container',
    '.feed-shared-text',
    '.feed-shared-update-v2__content',
    '.feed-shared-mini-update-v2__description',
    '.feed-shared-article',
    '.feed-shared-actor__description',
    '.feed-shared-actor__title',
    '.feed-shared-actor__sub-description',
    '.feed-shared-text-view',
    '.jobs-unified-top-card__content--two-pane',
    '.jobs-unified-top-card__primary-description',
    '.jobs-unified-top-card__job-title',
    '.jobs-unified-top-card__subtitle-primary',
    '.jobs-unified-top-card__description',
    '.update-components-text',
    '.update-components-actor__meta',
    '.update-components-actor__primary-text',
    '.job-card-list__entity-lockup',
    '.artdeco-entity-lockup__content',
    '.job-card-container__metadata-wrapper',
    '.job-card-container__footer-wrapper'
]};
