/**
 * Google Play Data Safety Form — Typed Schema
 *
 * Sources:
 *   [1] https://support.google.com/googleplay/android-developer/answer/10787469
 *       (data-safety-form.md, retrieved 2026-09-26)
 *   [2] https://developer.android.com/privacy-and-security/declare-data-use
 *       (declare-data-use.md, retrieved 2026-09-26)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CRITICAL DISTINCTION — "collected" vs "accessed on-device"
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Google's definition of "collect" is TRANSMISSION OFF DEVICE, not access.
 *
 *   "Collect" means transmitting data from your app off a user's device.
 *   — data-safety-form.md §"Data collection"
 *
 * An app that holds ACCESS_FINE_LOCATION but only uses coordinates locally
 * (e.g. to display a map without any network call) does NOT need to declare
 * "Precise location" as collected.  Only if those coordinates leave the device
 * (to your server, a third-party SDK, etc.) does collection apply.
 *
 * Exceptions that are still NOT "collected":
 *   • On-device access/processing: data accessed and processed entirely on
 *     the device, never transmitted off.
 *   • End-to-end encryption: data transmitted off device but unreadable by
 *     everyone including the developer (only sender/recipient hold keys).
 *
 * Exception that IS still "collected" even if not stored:
 *   • Ephemeral processing: data transmitted off device and processed only in
 *     memory, never persisted.  Must still be declared (though it is shown
 *     differently to users).
 *
 * In this schema the `DataTypeUsage.collected` field therefore means
 * "does the data leave the device?" — not "does the app hold a permission?".
 * Analyzers MUST NOT set collected:true solely from a permission declaration;
 * evidence of egress (network call, SDK upload, IPC to another app) is required.
 */

// ---------------------------------------------------------------------------
// Primitive value types
// ---------------------------------------------------------------------------

/** Whether a data type is collected, shared, or both. */
export type CollectionMode = 'collected' | 'shared' | 'both';

/** Granularity of user control over data collection. */
export type UserControl = 'optional' | 'required';

/**
 * The seven purposes Google defines for data collection and sharing.
 * Source: data-safety-form.md §"Purposes"
 */
export type CollectionPurpose =
  | 'appFunctionality'       // Features that are available in the app
  | 'analytics'              // Data about how users use the app / performance
  | 'developerCommunications'// News or notifications about the app or developer
  | 'advertisingOrMarketing' // Display/target ads, measure ad performance
  | 'fraudPreventionSecurityCompliance' // Fraud prevention, security, legal compliance
  | 'personalization'        // Customise app experience; recommendations
  | 'accountManagement';     // Setup or management of a user account

// ---------------------------------------------------------------------------
// Per-data-type usage declaration
// ---------------------------------------------------------------------------

/**
 * The complete set of questions Google asks per data type once it is selected.
 * All fields are optional at the TypeScript level because they are filled
 * progressively; use `needsReview` when the answer cannot be determined from
 * static analysis alone.
 *
 * Question mapping (from Play Console CSV format):
 *   collected / shared  →  PSL_DATA_USAGE_COLLECTION_AND_SHARING
 *   isEphemeral         →  PSL_DATA_USAGE_EPHEMERAL          (MAYBE_REQUIRED)
 *   userControl         →  DATA_USAGE_USER_CONTROL            (SINGLE_CHOICE)
 *   purposes            →  DATA_USAGE_COLLECTION_PURPOSE /
 *                          DATA_USAGE_SHARING_PURPOSE         (MULTIPLE_CHOICE)
 */
export interface DataTypeUsage {
  /**
   * True ONLY when this data type is transmitted off the user's device.
   * Holding a permission alone is INSUFFICIENT — egress must be confirmed.
   * False means the app accesses the data but processes it entirely on-device.
   */
  collected: boolean;

  /** True when this data type is transferred to a third party. */
  shared: boolean;

  /**
   * Applies only when collected === true.
   * True if data is transmitted off-device but only held in memory and never
   * persisted beyond the immediate request. Must still be declared, but is
   * presented differently in the Play Store listing.
   */
  isEphemeral?: boolean;

  /**
   * Applies only when collected === true.
   * 'optional' — users can opt out or the app works without it.
   * 'required' — collection is mandatory; users cannot disable it.
   */
  userControl?: UserControl;

  /** Purposes for which this data type is collected (≥1 required if collected). */
  collectionPurposes?: CollectionPurpose[];

  /** Purposes for which this data type is shared (≥1 required if shared). */
  sharingPurposes?: CollectionPurpose[];

  /**
   * Set to true when static analysis alone cannot determine the answer.
   * An analyzer should emit a Finding with confidence:'low' and include this
   * flag rather than guessing.
   */
  needsReview?: boolean;
}

// ---------------------------------------------------------------------------
// Data-type descriptors (schema / form definition layer)
// ---------------------------------------------------------------------------

/**
 * A single data type entry as Google defines it in the Data Safety form.
 * This is the SCHEMA (what is possible); `DataTypeUsage` is the INSTANCE
 * (what a specific app declares).
 */
export interface DataTypeDefinition {
  /** Machine-readable key used throughout analyzers. Must match DATA_TYPE_KEYS. */
  key: DataTypeKey;

  /** Exact label Google uses in the Play Console form. */
  label: string;

  /** Google's own definition of what counts as this data type. */
  definition: string;

  /** URL of the documentation page this definition comes from. */
  sourceUrl: string;

  /**
   * Set to true when Google's documentation is ambiguous about the boundary
   * of this data type and a human should review the declaration.
   */
  needsReview?: boolean;
}

/** A category groups related data types (e.g. "Location", "Messages"). */
export interface DataCategoryDefinition {
  /** Machine-readable key for the category. */
  key: DataCategoryKey;

  /** Exact label Google uses in the form. */
  label: string;

  /** URL of the documentation page for this category. */
  sourceUrl: string;

  /** The data types that belong to this category. */
  dataTypes: DataTypeDefinition[];
}

// ---------------------------------------------------------------------------
// Exhaustive key unions — single source of truth for string literals
// ---------------------------------------------------------------------------

export type DataCategoryKey =
  | 'location'
  | 'personalInfo'
  | 'financialInfo'
  | 'healthAndFitness'
  | 'messages'
  | 'photosAndVideos'
  | 'audioFiles'
  | 'filesAndDocs'
  | 'calendar'
  | 'contacts'
  | 'appActivity'
  | 'webBrowsing'
  | 'appInfoAndPerformance'
  | 'deviceOrOtherIds';

export type DataTypeKey =
  // Location
  | 'approximateLocation'
  | 'preciseLocation'
  // Personal info
  | 'name'
  | 'emailAddress'
  | 'userIds'
  | 'address'
  | 'phoneNumber'
  | 'raceAndEthnicity'
  | 'politicalOrReligiousBeliefs'
  | 'sexualOrientation'
  | 'otherPersonalInfo'
  // Financial info
  | 'userPaymentInfo'
  | 'purchaseHistory'
  | 'creditScore'
  | 'otherFinancialInfo'
  // Health and fitness
  | 'healthInfo'
  | 'fitnessInfo'
  // Messages
  | 'emails'
  | 'smsOrMms'
  | 'otherInAppMessages'
  // Photos and videos
  | 'photos'
  | 'videos'
  // Audio files
  | 'voiceOrSoundRecordings'
  | 'musicFiles'
  | 'otherAudioFiles'
  // Files and docs
  | 'filesAndDocs'
  // Calendar
  | 'calendarEvents'
  // Contacts
  | 'contacts'
  // App activity
  | 'appInteractions'
  | 'inAppSearchHistory'
  | 'installedApps'
  | 'otherUserGeneratedContent'
  | 'otherActions'
  // Web browsing
  | 'webBrowsingHistory'
  // App info and performance
  | 'crashLogs'
  | 'diagnostics'
  | 'otherAppPerformanceData'
  // Device or other IDs
  | 'deviceOrOtherIds';

// ---------------------------------------------------------------------------
// App-level security practice questions
// ---------------------------------------------------------------------------

/**
 * The three app-level yes/no questions Google asks in the "Data collection
 * and security" section of the form (independent of individual data types).
 * Source: data-safety-form.md §"Complete and submit your form"
 */
export interface AppSecurityPractices {
  /**
   * Is ALL user data collected or shared by the app encrypted in transit?
   * Note: Must be true for ALL data — partial encryption cannot be declared.
   * Source: data-safety-form.md §"Encryption in transit"
   */
  encryptionInTransit: boolean | null;

  /**
   * Does the app provide a mechanism for users to request deletion of their data?
   * Source: data-safety-form.md §"Deletion request mechanism"
   */
  deletionRequestMechanism: boolean | null;

  /**
   * Has the app been independently validated against a global security
   * standard (MASA / OWASP MASVS via a Google Authorized Lab)?
   * This is optional — null means the developer has not declared either way.
   * Source: data-safety-form.md §"Independent security review"
   */
  independentSecurityReview: boolean | null;
}

// ---------------------------------------------------------------------------
// Full schema catalogue
// ---------------------------------------------------------------------------

/**
 * The complete catalogue of Google Play Data Safety categories and data types,
 * exactly as documented. Do not add, remove, or rename entries without a
 * corresponding change in the source policy documents.
 *
 * Source [1]: https://support.google.com/googleplay/android-developer/answer/10787469
 * Source [2]: https://developer.android.com/privacy-and-security/declare-data-use
 */
export const DATA_SAFETY_SCHEMA: DataCategoryDefinition[] = [
  // ─── Location ─────────────────────────────────────────────────────────────
  {
    key: 'location',
    label: 'Location',
    sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#location',
    dataTypes: [
      {
        key: 'approximateLocation',
        label: 'Approximate location',
        definition:
          'User or device physical location to an area greater than or equal to 3 square kilometers, such as the city a user is in, or location provided by Android\'s ACCESS_COARSE_LOCATION permission. Note: Approximate location that is inferred, such as via IP address or Access Point Name, must be disclosed here.',
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#approximate-location',
      },
      {
        key: 'preciseLocation',
        label: 'Precise location',
        definition:
          'User or device physical location within an area less than 3 square kilometers, such as location provided by Android\'s ACCESS_FINE_LOCATION permission. Note: Precise location that is inferred, such as via IP address or Access Point Name, must be disclosed here.',
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#precise-location',
      },
    ],
  },

  // ─── Personal info ─────────────────────────────────────────────────────────
  {
    key: 'personalInfo',
    label: 'Personal info',
    sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#personal-info',
    dataTypes: [
      {
        key: 'name',
        label: 'Name',
        definition: 'How a user refers to themselves, such as their first or last name, or nickname.',
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#name',
      },
      {
        key: 'emailAddress',
        label: 'Email address',
        definition: "A user's email address.",
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#email-address',
      },
      {
        key: 'userIds',
        label: 'User IDs',
        definition:
          'Identifiers that relate to an identifiable person. For example, an account ID, account number, or account name.',
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#user-ids',
      },
      {
        key: 'address',
        label: 'Address',
        definition: "A user's address, such as a mailing or home address.",
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#address',
      },
      {
        key: 'phoneNumber',
        label: 'Phone number',
        definition: "A user's phone number.",
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#phone-number',
      },
      {
        key: 'raceAndEthnicity',
        label: 'Race and ethnicity',
        definition: "Information about a user's race or ethnicity.",
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#race-and-ethnicity',
      },
      {
        key: 'politicalOrReligiousBeliefs',
        label: 'Political or religious beliefs',
        definition: "Information about a user's political or religious beliefs.",
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#political-or-religious-beliefs',
      },
      {
        key: 'sexualOrientation',
        label: 'Sexual orientation',
        definition: "Information about a user's sexual orientation.",
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#sexual-orientation',
      },
      {
        key: 'otherPersonalInfo',
        label: 'Other info',
        definition:
          'Any other personal information such as date of birth, gender identity, veteran status, etc.',
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#other-info',
      },
    ],
  },

  // ─── Financial info ────────────────────────────────────────────────────────
  {
    key: 'financialInfo',
    label: 'Financial info',
    sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#financial-info',
    dataTypes: [
      {
        key: 'userPaymentInfo',
        label: 'User payment info',
        definition:
          "Information about a user's financial accounts such as credit card number.",
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#user-payment-info',
      },
      {
        key: 'purchaseHistory',
        label: 'Purchase history',
        definition: 'Information about purchases or transactions a user has made.',
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#purchase-history',
      },
      {
        key: 'creditScore',
        label: 'Credit score',
        definition:
          "Information about a user's credit. For example, their credit history or credit score.",
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#credit-score',
      },
      {
        key: 'otherFinancialInfo',
        label: 'Other financial info',
        definition:
          "Any other financial information. For example, a user's salary or debts.",
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#other-financial-info',
      },
    ],
  },

  // ─── Health and fitness ────────────────────────────────────────────────────
  {
    key: 'healthAndFitness',
    label: 'Health and fitness',
    sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#health-and-fitness',
    dataTypes: [
      {
        key: 'healthInfo',
        label: 'Health info',
        definition:
          "Information about a user's health, such as medical records or symptoms.",
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#health-info',
      },
      {
        key: 'fitnessInfo',
        label: 'Fitness info',
        definition:
          "Information about a user's fitness, such as exercise or other physical activity.",
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#fitness-info',
      },
    ],
  },

  // ─── Messages ──────────────────────────────────────────────────────────────
  {
    key: 'messages',
    label: 'Messages',
    sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#messages',
    dataTypes: [
      {
        key: 'emails',
        label: 'Emails',
        definition:
          "A user's emails including the email subject line, sender, recipients, and the content of the email.",
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#emails',
      },
      {
        key: 'smsOrMms',
        label: 'SMS or MMS',
        definition:
          "A user's text messages including the sender, recipients, and the content of the message.",
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#sms-or-mms',
      },
      {
        key: 'otherInAppMessages',
        // Note: The Play Console form labels this "Other in-app messages"
        // (data-safety-form.md §Data types table), while declare-data-use.md
        // calls it "Other messages". Using the Play Console label as canonical.
        label: 'Other in-app messages',
        definition:
          'Any other types of messages. For example, instant messages or chat content.',
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#other-messages',
      },
    ],
  },

  // ─── Photos and videos ─────────────────────────────────────────────────────
  {
    key: 'photosAndVideos',
    // Note: data-safety-form.md uses "Photos and videos" in the table header;
    // declare-data-use.md uses "Photos or videos". Play Console form is canonical.
    label: 'Photos and videos',
    sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#photos-or-videos',
    dataTypes: [
      {
        key: 'photos',
        label: 'Photos',
        definition: "A user's photos.",
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#photos',
      },
      {
        key: 'videos',
        label: 'Videos',
        definition: "A user's videos.",
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#videos',
      },
    ],
  },

  // ─── Audio files ───────────────────────────────────────────────────────────
  {
    key: 'audioFiles',
    label: 'Audio files',
    sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#audio-files',
    dataTypes: [
      {
        key: 'voiceOrSoundRecordings',
        label: 'Voice or sound recordings',
        definition: "A user's voice such as a voicemail or a sound recording.",
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#voice-or-sound-recordings',
      },
      {
        key: 'musicFiles',
        label: 'Music files',
        definition: "A user's music files.",
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#music-files',
      },
      {
        key: 'otherAudioFiles',
        label: 'Other audio files',
        definition: 'Any other user-created or user-provided audio files.',
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#other-audio-files',
      },
    ],
  },

  // ─── Files and docs ────────────────────────────────────────────────────────
  {
    key: 'filesAndDocs',
    label: 'Files and docs',
    sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#files-and-docs',
    dataTypes: [
      {
        key: 'filesAndDocs',
        label: 'Files and docs',
        definition:
          "A user's files or documents, or information about their files or documents such as file names.",
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#files-and-docs',
      },
    ],
  },

  // ─── Calendar ──────────────────────────────────────────────────────────────
  {
    key: 'calendar',
    label: 'Calendar',
    sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#calendar',
    dataTypes: [
      {
        key: 'calendarEvents',
        label: 'Calendar events',
        definition:
          "Information from a user's calendar such as events, event notes, and attendees.",
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#calendar',
      },
    ],
  },

  // ─── Contacts ──────────────────────────────────────────────────────────────
  {
    key: 'contacts',
    label: 'Contacts',
    sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#contacts',
    dataTypes: [
      {
        key: 'contacts',
        label: 'Contacts',
        definition:
          "Information about the user's contacts such as contact names, message history, and social graph information like usernames, contact recency, contact frequency, interaction duration and call history.",
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#contacts',
      },
    ],
  },

  // ─── App activity ──────────────────────────────────────────────────────────
  {
    key: 'appActivity',
    label: 'App activity',
    sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#app-activity',
    dataTypes: [
      {
        key: 'appInteractions',
        label: 'App interactions',
        definition:
          'Information about how a user interacts with the app. For example, the number of times they visit a page, screenshots taken, or sections they tap on.',
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#app-interactions',
      },
      {
        key: 'inAppSearchHistory',
        label: 'In-app search history',
        definition: 'Information about what a user has searched for in your app.',
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#in-app-search-history',
      },
      {
        key: 'installedApps',
        label: 'Installed apps',
        definition: 'Information about the apps installed on a user\'s device.',
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#installed-apps',
      },
      {
        key: 'otherUserGeneratedContent',
        label: 'Other user-generated content',
        definition:
          'Any other user-generated content not listed here, or in any other section. For example, user bios, notes, or open-ended responses.',
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#other-user-generated-content',
      },
      {
        key: 'otherActions',
        label: 'Other actions',
        definition:
          'Any other user activity or actions in-app not listed here such as gameplay, likes, and dialog options.',
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#other-actions',
      },
    ],
  },

  // ─── Web browsing ──────────────────────────────────────────────────────────
  {
    key: 'webBrowsing',
    label: 'Web browsing',
    sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#web-browsing',
    dataTypes: [
      {
        key: 'webBrowsingHistory',
        label: 'Web browsing history',
        definition: 'Information about the websites a user has visited.',
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#web-browsing',
      },
    ],
  },

  // ─── App info and performance ──────────────────────────────────────────────
  {
    key: 'appInfoAndPerformance',
    label: 'App info and performance',
    sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#app-info-and-performance',
    dataTypes: [
      {
        key: 'crashLogs',
        label: 'Crash logs',
        definition:
          'Crash log data from your app. For example, the number of times your app has crashed, stack traces, or other information directly related to a crash.',
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#crash-logs',
      },
      {
        key: 'diagnostics',
        label: 'Diagnostics',
        definition:
          'Information about the performance of your app. For example battery life, loading time, latency, framerate, or any technical diagnostics.',
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#diagnostics',
      },
      {
        key: 'otherAppPerformanceData',
        label: 'Other app performance data',
        definition: 'Any other app performance data not listed here.',
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#other-app-performance-data',
      },
    ],
  },

  // ─── Device or other IDs ───────────────────────────────────────────────────
  {
    key: 'deviceOrOtherIds',
    label: 'Device or other IDs',
    sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#device-or-other-ids',
    dataTypes: [
      {
        key: 'deviceOrOtherIds',
        label: 'Device or other IDs',
        definition:
          'Identifiers that relate to an individual device, browser or app. For example, an IMEI number, MAC address, Widevine Device ID, Firebase installation ID, or advertising identifier.',
        sourceUrl: 'https://developer.android.com/privacy-and-security/declare-data-use#device-or-other-ids',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Purpose catalogue
// ---------------------------------------------------------------------------

export interface PurposeDefinition {
  key: CollectionPurpose;
  label: string;
  description: string;
  example: string;
  sourceUrl: string;
}

/**
 * The seven collection/sharing purposes Google defines.
 * Source: data-safety-form.md §"Purposes"
 */
export const COLLECTION_PURPOSES: PurposeDefinition[] = [
  {
    key: 'appFunctionality',
    label: 'App functionality',
    description: 'Used for features that are available in the app.',
    example: 'For example to enable app features, or authenticate users.',
    sourceUrl: 'https://support.google.com/googleplay/android-developer/answer/10787469#purposes',
  },
  {
    key: 'analytics',
    label: 'Analytics',
    description: 'Used to collect data about how users use the app or how it performs.',
    example:
      'For example, to see how many users are using a particular feature, to monitor app health, to diagnose and fix bugs or crashes, or to make future performance improvements.',
    sourceUrl: 'https://support.google.com/googleplay/android-developer/answer/10787469#purposes',
  },
  {
    key: 'developerCommunications',
    label: 'Developer communications',
    description: 'Used to send news or notifications about the app or the developer.',
    example:
      'For example, sending a push notification to inform users about an important security update, or informing users about new features of the app.',
    sourceUrl: 'https://support.google.com/googleplay/android-developer/answer/10787469#purposes',
  },
  {
    key: 'advertisingOrMarketing',
    label: 'Advertising or marketing',
    description:
      'Used to display or target ads or marketing communications, or measuring ad performance.',
    example:
      'For example, displaying ads in your app, sending push notifications to promote other products or services, or sharing data with advertising partners.',
    sourceUrl: 'https://support.google.com/googleplay/android-developer/answer/10787469#purposes',
  },
  {
    key: 'fraudPreventionSecurityCompliance',
    label: 'Fraud prevention, security, and compliance',
    description: 'Used for fraud prevention, security, or compliance with laws.',
    example:
      'For example, monitoring failed login attempts to identify possible fraudulent activity.',
    sourceUrl: 'https://support.google.com/googleplay/android-developer/answer/10787469#purposes',
  },
  {
    key: 'personalization',
    label: 'Personalization',
    description: 'Used to customize your app, such as showing recommended content or suggestions.',
    example:
      "For example, suggesting playlists based on the user's listening habits or delivering local news based on the user's location.",
    sourceUrl: 'https://support.google.com/googleplay/android-developer/answer/10787469#purposes',
  },
  {
    key: 'accountManagement',
    label: 'Account management',
    description: "Used for the setup or management of a user's account with the developer.",
    example:
      "For example, to enable users to create accounts or add information to an account the developer provides for use across its services, log in to your app, or verify their credentials.",
    sourceUrl: 'https://support.google.com/googleplay/android-developer/answer/10787469#purposes',
  },
];

// ---------------------------------------------------------------------------
// Convenience lookup maps
// ---------------------------------------------------------------------------

/** Fast lookup: DataTypeKey → DataTypeDefinition */
export const DATA_TYPE_MAP: Readonly<Record<DataTypeKey, DataTypeDefinition>> =
  Object.fromEntries(
    DATA_SAFETY_SCHEMA.flatMap((cat) => cat.dataTypes.map((dt) => [dt.key, dt]))
  ) as Readonly<Record<DataTypeKey, DataTypeDefinition>>;

/** Fast lookup: DataTypeKey → parent DataCategoryDefinition */
export const DATA_TYPE_TO_CATEGORY: Readonly<Record<DataTypeKey, DataCategoryDefinition>> =
  Object.fromEntries(
    DATA_SAFETY_SCHEMA.flatMap((cat) => cat.dataTypes.map((dt) => [dt.key, cat]))
  ) as Readonly<Record<DataTypeKey, DataCategoryDefinition>>;

/** Fast lookup: CollectionPurpose → PurposeDefinition */
export const PURPOSE_MAP: Readonly<Record<CollectionPurpose, PurposeDefinition>> =
  Object.fromEntries(COLLECTION_PURPOSES.map((p) => [p.key, p])) as Readonly<
    Record<CollectionPurpose, PurposeDefinition>
  >;

// ---------------------------------------------------------------------------
// All valid DataTypeKey values as a runtime array (useful for exhaustiveness
// checks and test fixtures).
// ---------------------------------------------------------------------------
export const ALL_DATA_TYPE_KEYS: DataTypeKey[] = DATA_SAFETY_SCHEMA.flatMap((cat) =>
  cat.dataTypes.map((dt) => dt.key)
);
