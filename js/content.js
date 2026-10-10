// ════════════════════════════════
//  CONTENT  (all of Abel's portfolio text and data)
// ════════════════════════════════
// Single source of truth for every window that shows portfolio copy.
// Plain-text fields must be escaped by the renderer; only `bio` paragraphs
// are trusted HTML (inline <a> tags). No other file should hard-code this text.
const PORTFOLIO = {
  name: 'Abel Ninan',
  firstName: 'Abel',
  title: 'Data Analyst',
  tagline: 'Data Analyst | SQL, Power BI and Microsoft Fabric | Builder of apps, data pipelines and AI workflows',
  email: 'abelninan@outlook.com',

  links: {
    linkedin: 'https://www.linkedin.com/in/abelninan',
    github: 'https://github.com/abel-ninan',
    resumePdf: 'docs/Abel_Ninan_Resume.pdf',
    appStore: 'https://apps.apple.com/us/app/hairmaxxx/id6758323696'
  },

  welcome: {
    headline: "Welcome to Abel Ninan's Windows 95 portfolio.",
    body: "I'm a data analyst who builds apps, data pipelines and AI workflows."
  },

  // Notepad "Abel Ninan Bio": 4 paragraphs, trusted HTML (inline links only)
  bio: [
    'Abel Ninan is a Data Analyst at <a href="https://www.cefcu.com" target="_blank" rel="noopener">CEFCU</a> and a graduate of Illinois State University, where he earned a B.S. in Business Information Systems with a minor in Data Analytics, chaired the Student Technology Advisory Committee and served on the university\'s Committee for the Responsible Use of Artificial Intelligence. Endlessly curious and a little obsessed with details, Abel loves taking messy, scattered data and turning it into decisions people can act on.',
    'His day-to-day toolkit is SQL, Power BI, Microsoft Fabric and SSIS, and he automates anything he has to do twice. The proof goes beyond the office: Abel designed, coded and shipped his own iOS app, <a href="https://apps.apple.com/us/app/hairmaxxx/id6758323696" target="_blank" rel="noopener">HairMaxxx</a>, to the App Store, and he builds multi-agent AI workflows that handle hours of research in minutes.',
    'He is a creator, too. Abel grew the history TikTok @historyslides to more than 500,000 followers and engineered an automated pipeline that takes a story from research to a finished, quality-checked video with a single command. Running it as a business gave him hands-on e-commerce experience, from storefront code to the numbers behind every sale.',
    'And when he finally steps away from the keyboard? Abel has wrestled for more than 13 years, earning team captain and state qualifier honors, and he now gives back as a volunteer wrestling coach at Normal Community High School. He also trains Brazilian Jiu-Jitsu and Muay Thai, so his competitive streak reaches well beyond the dashboard.'
  ],

  experience: [
    {
      role: 'Data Analyst',
      company: 'CEFCU (Citizens Equity First Credit Union)',
      start: 'Nov. 2024',
      end: 'Present',
      current: true,
      bullets: [
        'Write and maintain reusable SQL views built on CTEs, window functions and set-based logic, giving analysts and business partners one consistent, documented definition for recurring metrics.',
        'Own data requests end to end: run intake with stakeholders to pin down the business question, definitions and grain, then pull, validate and deliver the data with clear documentation of every assumption.',
        'Lead deep-dive research analyses that turn open-ended business questions into quantified trends, segment breakdowns and recommendations for leadership.',
        'Build Power BI dashboards on star-schema semantic models with DAX measures, Power Query transformations and row-level security, replacing manual spreadsheets with self-service reporting.',
        'Partner with the data engineering team on SSIS ETL packages, contributing incremental-load logic, error handling and logging, SQL Server Agent scheduling, and reconciliation checks that validate every load before release.'
      ]
    },
    {
      role: 'Artificial Intelligence Intern',
      company: 'Illinois State University DeepLearners',
      start: 'Sep. 2023',
      end: 'Jul. 2024',
      current: false,
      bullets: [
        'Led a team to develop an Automatic Speech Recognition (ASR) system for a speech-to-text application at Illinois State University, enhancing lecture transcriptions and meeting summaries.',
        "Developed a web application using HTML, CSS and JavaScript that enables data transmission to a local SQL database, supporting the AI model's backend infrastructure.",
        'Deployed and fine-tuned a specialized Large Language Model to summarize textual content from meetings and lectures, employing cutting-edge NLP techniques to distill critical information from varied audio data sources.',
        'Configured and deployed a distributed computing setup using Dask in a Linux environment to enhance the performance of the speech-to-text AI model, enabling efficient processing of large audio datasets.'
      ]
    },
    {
      role: 'Secretary of Information Technology',
      company: 'Student Government Association',
      start: 'Aug. 2023',
      end: 'May 2024',
      current: false,
      bullets: [
        'Developed and maintained the Student Government Association website utilizing HTML and Omni CMS for efficient design and functionality.',
        'Led the implementation and configuration of Slack, optimizing student government communication channels, automating task assignments, and enhancing event planning workflows through integration with calendars and project management tools.',
        'Managed and resolved complex IT inquiries and issues, showcasing expertise in advanced technical troubleshooting.',
        'Collaborated with IT teams to diagnose and resolve critical technical challenges, substantially enhancing the underlying technological infrastructure.'
      ]
    },
    {
      role: 'Student Executive Support',
      company: 'Endpoint Support',
      start: 'Feb. 2023',
      end: 'Aug. 2024',
      current: false,
      bullets: [
        'Promoted to a senior role, providing comprehensive system administration and IT support to ISU executives to enhance productivity and information security.',
        'Wrote PowerShell scripts for automating system management and improving operational efficiency.',
        'Efficiently managed user accounts, permissions, and access controls within Active Directory using PowerShell scripts for streamlined onboarding and offboarding processes.'
      ]
    },
    {
      role: 'Student Technology Support',
      company: 'Endpoint Support',
      start: 'Mar. 2022',
      end: 'Feb. 2023',
      current: false,
      bullets: [
        'Leveraged the Cherwell Service Management platform to efficiently prioritize, troubleshoot, and resolve IT service requests, ensuring timely ticket resolution and thorough documentation for future reference.',
        'Automated and optimized asset tracking for over 3,000 laptops and IT equipment using tools like Excel, Power BI, and SQL, ensuring accurate inventory control, lifecycle management, and real-time reporting.',
        'Led a project to deploy 600 loaner laptops to ISU students, using Microsoft Intune for cloud-based setup and management while developing and maintaining standard operating procedures.',
        'Delivered IT Service Management training to new hires, covering best practices, system navigation, troubleshooting, and security protocols to enhance service quality and team skill set.'
      ]
    }
  ],

  education: [
    {
      school: 'Illinois State University',
      degree: 'B.S. Business Information Systems',
      minor: 'Data Analytics',
      date: 'August 2024'
    }
  ],

  skills: [
    { group: 'Data and BI', items: ['SQL Server', 'Power BI', 'DAX', 'Power Query', 'Microsoft Fabric', 'SSIS', 'Excel', 'Tableau', 'SPSS'] },
    { group: 'Languages', items: ['Python', 'SQL', 'JavaScript', 'TypeScript', 'VB.NET', 'ASP.NET', 'HTML', 'CSS'] },
    { group: 'Data Engineering', items: ['PySpark', 'pandas', 'NumPy', 'Delta Lake', 'KQL', 'dbt', 'Apache Airflow', 'Snowflake', 'PostgreSQL'] },
    { group: 'AI and Automation', items: ['Claude API', 'Claude Code', 'Gemini API', 'Model Context Protocol (MCP)', 'Multi-agent workflows', 'LLM evaluation', 'Prompt engineering', 'Playwright', 'OpenCV', 'ffmpeg'] },
    { group: 'Web and Apps', items: ['React', 'Vite', 'Tailwind CSS', 'Capacitor (iOS)', 'Supabase', 'FastAPI', 'Shopify Hydrogen', 'GraphQL', 'RevenueCat'] },
    { group: 'Cloud and DevOps', items: ['AWS', 'Azure', 'Docker', 'Git/GitHub', 'GitHub Actions', 'PowerShell', 'Unix Shell', 'VMware'] },
    { group: 'IT and Tools', items: ['Active Directory', 'Microsoft Intune', 'Cherwell Service Management', 'Confluence', 'VS Code', 'AutoCAD'] }
  ],

  certifications: [
    { name: 'AWS Certified Data Engineer - Associate', issuer: 'Amazon Web Services', date: 'Nov. 2024' },
    { name: 'AWS Certified AI Practitioner', issuer: 'Amazon Web Services', date: 'Sep. 2024' },
    { name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', date: 'Mar. 2024' },
    { name: 'Certified Scrum Master (CSM)', issuer: 'Scrum Alliance', date: 'Feb. 2024' },
    { name: 'Certified Scrum Product Owner (CSPO)', issuer: 'Scrum Alliance', date: 'Feb. 2024' }
  ],

  leadership: [
    { role: 'Chair', org: 'Student Technology Advisory Committee, Illinois State University', date: '2024' },
    { role: 'Member, Operations Subcommittee', org: 'Committee for the Responsible Use of Artificial Intelligence, Illinois State University', date: '2024' }
  ],

  interests: [
    'Wrestling: 13+ years, team captain and state qualifier',
    'Volunteer wrestling coach, Normal Community High School',
    'Brazilian Jiu-Jitsu',
    'Muay Thai',
    'History and storytelling',
    'AI copilots, data agents and MCP',
    'SQL + AI',
    'Microsoft Fabric and Power BI (FabCon 2026, Atlanta)'
  ],

  projects: [
    // ── 1. HairMaxxx ──────────────────────────────
    {
      id: 'hairmaxx',
      title: 'HairMaxxx',
      subtitle: 'AI hairline analysis app for iOS, designed, built and shipped solo',
      badge: 'Live on the App Store',
      period: 'Dec. 2025 - Present',
      role: 'Solo founder and developer',
      icon: 'img/icons/hairmaxx.png',
      summary: 'HairMaxxx turns a few guided selfies into a clear, structured hairline report. I built every layer myself, from the React app wrapped for iOS to the hardened backend that calls Google Gemini. Since its February 2026 launch it has shipped 23 builds and holds a 5.0-star App Store rating.',
      hero: {
        src: 'img/projects/hairmaxx-overview.jpg', width: 1400, height: 502,
        alt: 'Six screens from the HairMaxxx iOS app shown side by side',
        caption: 'From guided selfies to a structured hairline report: six screens from the live app.'
      },
      metrics: [
        { value: '5.0', label: 'App Store rating' },
        { value: '23', label: 'Builds shipped' },
        { value: '~200', label: 'Users' },
        { value: '31.4%', label: 'Ad 3-second hold rate (benchmark ~20%)' },
        { value: '100 s', label: 'Model fallback budget' }
      ],
      sections: [
        {
          heading: 'Overview',
          paragraphs: [
            'HairMaxxx is an iOS app for AI hairline analysis, positioned as an entertainment and education tool. A user takes up to five guided selfies (front, left and right), answers a short quiz, and gets back an overall hairline score, a Norwood-scale stage estimate, region-by-region observations for the temples and crown, positives, watch-outs, and a grooming routine and plan.',
            'The app also includes a Coach library of grooming content, scan history with trend charts, and pay-per-scan purchases. I own the whole product, from design and code to payments, App Store submissions, marketing and monitoring. The current release is v1.3.4 (October 2026).'
          ]
        },
        {
          heading: 'How it works',
          steps: [
            'Capture: guided front, left and right photos plus a short quiz, with Capacitor 6 native media and haptics.',
            'Validate: a Supabase Edge Function in Deno and TypeScript (about 730 lines) checks the app origin, limits each IP to 5 requests per minute, and validates every image by MIME type, size and count (4 MB each, 10 MB total, 5 max).',
            'Analyze: photos and quiz answers go to Google Gemini, which returns structured JSON that is type-checked field by field with safe defaults.',
            'Charge last: a scan credit is consumed only after a valid result is saved to Postgres, so malformed model output or a failed call never costs the user a scan.',
            'Track: profiles, scans, scan comparisons and progress reports live in Postgres, and TanStack Query and Recharts power the history and trend views.'
          ]
        },
        {
          heading: 'Highlights',
          bullets: [
            'Model fallback chain: after a Gemini model retirement caused overload errors, I built a chain that rotates across Gemini models within a 100-second budget. Each attempt is capped at 45 seconds, and because overload errors fail fast, one request can make up to 8 passes. The model list is configurable without redeploying.',
            'Self-built uptime monitor: a scheduled script keeps the free-tier backend from pausing, restores it if it does, runs one real end-to-end test scan every day and alerts me on any failure.',
            'Pricing migration: moved from a subscription to $4.99 pay-per-scan while grandfathering existing subscribers through RevenueCat, then added a Daily Scans subscription in v1.3.4.',
            'App Store review: worked through guidelines 1.4.1 and 2.1(a), fixed an iOS 27 launch crash, and redesigned onboarding with QA at multiple screen widths and on the iPhone 17 Pro simulator.',
            'Growth test: a paid Instagram install campaign, run behind my own Python guardrail scripts and KPI monitors, reached a 31.4% 3-second hold rate (app-ad benchmark about 20%) at roughly $4.35 per incremental install, measured against the background install rate.'
          ]
        },
        {
          heading: 'What I learned',
          paragraphs: [
            'Shipping a real product taught me that trust is built in the unglamorous parts: validating every input, never charging for a failure, and knowing the backend is down before a user does.'
          ]
        }
      ],
      stack: ['React 18', 'TypeScript', 'Vite', 'Tailwind CSS', 'shadcn/ui', 'Radix UI', 'TanStack Query', 'Recharts', 'Zod', 'Capacitor 6', 'Supabase', 'PostgreSQL', 'Deno Edge Functions', 'Google Gemini API', 'RevenueCat', 'Meta SDK', 'SKAdNetwork', 'GitHub Pages', 'Python'],
      images: [],
      links: [
        { label: 'View on the App Store', url: 'https://apps.apple.com/us/app/hairmaxxx/id6758323696' }
      ]
    },

    // ── 2. AI Lead Generation Workflow ─────────────
    {
      id: 'leadgen',
      title: 'AI Lead Generation Workflow',
      subtitle: 'Multi-agent Claude Code pipeline that finds and verifies cold-call leads',
      badge: 'Multi-agent AI',
      period: 'Jul. 2026 - Aug. 2026',
      role: 'Designer and developer',
      icon: 'img/icons/leadgen.png',
      summary: 'A multi-agent workflow that finds active US trade businesses on Google Maps that have no website: the ideal call list for a web-design agency. About 110 AI agents work in three independent passes (Discover, Verify and Audit) so no agent ever grades its own work, and the output is a ranked, Maps-linked Excel workbook. Two runs delivered 136 verified leads.',
      hero: {
        src: 'img/projects/leadgen-pipeline.svg', width: 480, height: 686,
        alt: 'Pipeline diagram: Discover, Verify and Audit agent passes feeding a dedupe memory and an Excel lead workbook',
        caption: 'Three independent passes, so no agent grades its own work.'
      },
      metrics: [
        { value: '136', label: 'Verified leads delivered' },
        { value: '1,440', label: 'Trade x city searches in scope' },
        { value: '~110', label: 'AI agents per run' },
        { value: '0', label: 'Audit mismatches in run 1' },
        { value: '11', label: 'Bugs caught by adversarial review' }
      ],
      sections: [
        {
          heading: 'Overview',
          paragraphs: [
            'The best cold-call prospect for a web-design agency is a business that is clearly busy but has no website, and finding those by hand means hours of clicking through map listings. I built a Claude Code workflow, about 650 lines of JavaScript orchestration, that runs the search, verification and audit with parallel AI agents and hands back a call-ready spreadsheet.',
            'The search space covers 24 trades across 60 cities, or 1,440 combinations. A persistent dedupe memory records every business and every search ever seen, so a rerun never repeats a lead.'
          ]
        },
        {
          heading: 'How it works',
          steps: [
            'Discover: about 60 discovery agents run in parallel across the trade and city searches, collecting candidate listings that show no website.',
            'Verify: about 35 agents open each place page, read the business facts, sort reviews newest first, and web-search for closures and any existing site.',
            'Audit: about 15 fresh agents independently re-check every surviving lead against the same bar, and any disagreement is flagged instead of silently resolved.',
            'Qualify: a lead ships only with no website proven three ways (listing card, place page including menu and booking links, and web search), at least 25 reviews and 4.0 stars, a newest review within 3 months, and at least 6 reviews in the last 12 months. Franchises and toll-free numbers are rejected.',
            'Classify phones: a free first pass uses NANPA prefix data, then Twilio Lookup v2 confirms line type at $0.008 per number behind a cache, so no number is ever billed twice.',
            'Deliver: an Excel workbook with Maps-linked business names and phone numbers, split into Tier A and Tier B.'
          ]
        },
        {
          heading: 'Results',
          bullets: [
            'Run 1: 30 searches produced 189 candidates and 94 delivered leads (58 Tier A, 36 Tier B) across 23 cities and 13 trades, with zero audit mismatches.',
            'Run 2: 42 more leads, ranked by a combined score, for 136 verified leads in total.'
          ]
        },
        {
          heading: 'Engineering rigor',
          bullets: [
            'Separation of duties: discovery, verification and audit are independent agent pools, so no agent ever checks its own answer.',
            'Adversarial review: 27 reviewer agents attacked the workflow through 4 lenses and found 11 real bugs, all fixed, including "last review" dates that were being scraped from owner posts instead of customer reviews.',
            'Bias testing: an anchoring-bias experiment on 73 leads checked whether agents were swayed by earlier answers; no date reading shifted by more than 2 months.',
            'Privacy: lead data stays private, so no business names or phone numbers appear on this site.'
          ]
        }
      ],
      stack: ['Claude Code', 'JavaScript', 'Multi-agent orchestration', 'Prompt engineering', 'Google Maps', 'Web search', 'Twilio Lookup v2', 'NANPA prefix data', 'Excel'],
      images: [],
      links: [
        { label: 'GitHub profile', url: 'https://github.com/abel-ninan' }
      ]
    },

    // ── 3. @historyslides ──────────────────────────
    {
      id: 'historyslides',
      title: '@historyslides',
      subtitle: '500K-follower history brand and an automated video production pipeline',
      badge: '508.6K followers',
      period: '2023 - Present',
      role: 'Creator, owner and pipeline engineer',
      icon: 'img/icons/historyslides.png',
      summary: 'I grew @historyslides on TikTok to 508.6K followers and 24.5M likes and run it as a content and e-commerce business. To publish at that level I engineered a production pipeline, about 36K lines of tested Python, that turns one command into a finished, quality-checked 1080x1920 vertical video.',
      hero: {
        src: 'img/projects/historyslides-profile.jpg', width: 720, height: 576,
        alt: 'The @historyslides TikTok profile showing 508.6K followers and 24.5M likes',
        caption: '@historyslides on TikTok: 508.6K followers and 24.5M likes.'
      },
      metrics: [
        { value: '508.6K', label: 'TikTok followers' },
        { value: '24.5M', label: 'Likes' },
        { value: '3.78M', label: 'Views on top 2026 post' },
        { value: '810', label: 'Automated tests' },
        { value: '~90%', label: 'Vision tokens cut per call' }
      ],
      sections: [
        {
          heading: 'Overview',
          paragraphs: [
            '@historyslides tells short, punchy stories from history with archival photographs and narration. Since 2023 it has grown to 508.6K followers and 24.5M likes; in 2026 its top post reached 3.78M views, with others at 2.73M and 2.19M.',
            'The account runs as a content and e-commerce business. On the commerce side I built a headless Shopify Hydrogen storefront with React Router 7 and Tailwind, typed Storefront API GraphQL queries with generated types, and wrote Admin API scripts that seed the product catalog.',
            'Publishing consistently is a production problem, so I treated it like one. The pipeline finds its own topics, researches them, writes and voices the script, sources the images, edits and captions the video, and checks its own work. One command produces a finished 1080x1920, 30 fps, 60 to 70 second vertical video.'
          ]
        },
        {
          heading: 'How it works',
          steps: [
            'Topic discovery: agents scan history archives and trending formats for stories with a strong hook, then score and queue the best ideas.',
            'Research: each topic is researched across reputable sources, with key facts, dates and names cross-checked before anything is written.',
            'Script: an LLM writes a hook-first, 60 to 70 second script and breaks it into beats that each name what must be on screen.',
            'Voice: the script is voiced with ElevenLabs, behind a cache so paid text-to-speech is never bought twice.',
            'Images: agents source archival photos for every beat, with perceptual hashing (pHash and dHash) to catch duplicates and OpenCV quality checks to reject weak images.',
            'Timeline: faster-whisper aligns the narration word by word, so every photo cuts in on the exact word that names it, with smooth Ken Burns zoom motion.',
            'Captions: word-by-word captions and a watermark are burned in.',
            'Assemble and edit: ffmpeg renders and edits the final vertical video.',
            'QA: 11 auditors inspect the render, and any failure feeds a self-healing retry loop.'
          ]
        },
        {
          heading: 'Highlights',
          bullets: [
            'Architecture: 9 stages, 14 agents and 11 QA auditors, about 36K lines of Python covered by 810 tests across 77 test files.',
            'Self-healing QA: auditors check A/V sync drift over 0.30 seconds, photo identity and duplicates, black frames, baked-in text or watermarks, and pacing. If QA still fails after retries, the file is renamed final_QA_FAILED.mp4, so a broken video can never look finished.',
            'Profiling-led optimization: profiling showed image sourcing took 51.6% of runtime and vision calls 37%, against only 10% for ffmpeg, so optimization started where the time actually went.',
            'Measured wins: vision tokens per call cut from roughly 62-73K to about 6.4K (around 90%), 30x smoother zoom motion, and 19% faster caption burn-in.',
            'Publishing: scheduled through the Buffer API behind a QA gate, with a double-post guard and posting receipts.'
          ]
        }
      ],
      stack: ['Python', 'faster-whisper', 'ElevenLabs', 'Playwright', 'OpenCV', 'Perceptual hashing (pHash/dHash)', 'LLM vision agents', 'ffmpeg', 'pytest', 'Buffer API', 'Shopify Hydrogen', 'React Router 7', 'Tailwind CSS', 'GraphQL', 'TypeScript'],
      images: [
        {
          src: 'img/projects/historyslides-frame.jpg', width: 540, height: 960,
          alt: 'A rendered vertical video frame with an archival photo, a word-by-word caption and a watermark',
          caption: 'A finished 1080x1920 frame: archival photo, word-level caption and watermark.'
        },
        {
          src: 'img/projects/historyslides-pipeline.svg', width: 480, height: 724,
          alt: 'Diagram of the nine-stage video pipeline from topic discovery to QA',
          caption: 'Nine stages, from topic discovery to QA, with 11 auditors in a self-healing loop.'
        }
      ],
      links: [
        { label: '@historyslides on TikTok', url: 'https://www.tiktok.com/@historyslides' }
      ]
    },

    // ── 4. Lecture & Meeting AI (AI internship) ────
    {
      id: 'deeplearners',
      title: 'Lecture & Meeting AI',
      subtitle: 'Speech recognition and LLM summaries for Illinois State University, built during my AI internship',
      badge: 'AI internship',
      period: 'Sep. 2023 - Jul. 2024',
      role: 'AI Intern and student team lead',
      icon: 'img/icons/deeplearners.png',
      summary: 'As an Artificial Intelligence Intern with Illinois State University\'s DeepLearners group, I led a student team that built an end-to-end system to turn lecture and meeting recordings into searchable transcripts and concise AI summaries. We fine-tuned a Whisper speech-recognition model on lecture audio, scaled transcription across a Dask cluster on Linux, fine-tuned a large language model to write structured summaries, and shipped it all behind a web app backed by a SQL database.',
      hero: {
        src: 'img/projects/deeplearners-pipeline.svg', width: 480, height: 761,
        alt: 'Diagram of the pipeline from lecture audio through preprocessing, a Dask cluster, Whisper speech recognition and an LLM summarizer to a SQL database and web app',
        caption: 'From raw lecture audio to a searchable transcript and summary.'
      },
      metrics: [
        { value: '~48%', label: 'Lower word error rate after fine-tuning' },
        { value: '6.5x', label: 'Faster batch transcription on Dask' },
        { value: '500+', label: 'Hours of audio processed' },
        { value: '5', label: 'Student developers led' }
      ],
      sections: [
        {
          heading: 'Overview',
          paragraphs: [
            'Recorded lectures and meetings are full of useful information that nobody has time to re-watch. The goal was a campus tool that turns any recording into an accurate transcript and a short, structured summary of the key points, decisions and action items.',
            'I led the student team through two-week sprints, owned the speech-recognition and summarization work, and built the web front end and its database connection. Off-the-shelf speech models struggled with lecture audio (room echo, fast speakers and technical vocabulary), so the project focused on fine-tuning and on making processing fast enough for full semesters of recordings.'
          ]
        },
        {
          heading: 'How it works',
          steps: [
            'Upload: faculty and students upload a recording through a web app built with HTML, CSS and JavaScript.',
            'Preprocess: ffmpeg resamples audio to 16 kHz mono, and voice-activity detection splits it into clean speech chunks with silence trimmed.',
            'Distribute: chunks are fanned out across a Dask distributed cluster of Linux workers, so long recordings and whole backlogs are transcribed in parallel instead of one file at a time.',
            'Transcribe: a Whisper model fine-tuned with Hugging Face Transformers on lecture audio produces a timestamped transcript, and the chunks are stitched back together in order.',
            'Summarize: a large language model fine-tuned with LoRA (parameter-efficient fine-tuning) on lecture and meeting transcripts writes a structured summary: key points, definitions, decisions and action items.',
            'Store and serve: transcripts, summaries and metadata are written to a local SQL database, and the web app lets users search, read and download them.'
          ]
        },
        {
          heading: 'Highlights',
          bullets: [
            'Accuracy: fine-tuning Whisper on hand-corrected lecture transcripts cut word error rate by roughly half on held-out lectures, with the biggest gains on course-specific terminology.',
            'Speed: moving batch transcription onto a Dask cluster on Linux made processing about 6.5x faster than a single machine, which made semester-sized backlogs practical.',
            'Summaries people use: LoRA fine-tuning kept training cheap enough for university hardware, and summaries were scored with ROUGE plus human review against reference notes.',
            'Full stack: built the web app (HTML, CSS, JavaScript) and the data path into the SQL database that the model backend reads from and writes to.',
            'Team lead: ran sprint planning, code reviews and demos for a team of five student developers.'
          ]
        }
      ],
      stack: ['Python', 'PyTorch', 'Hugging Face Transformers', 'Whisper (ASR)', 'LoRA / PEFT', 'Large language models', 'Dask', 'Linux', 'ffmpeg', 'SQL', 'HTML', 'CSS', 'JavaScript', 'ROUGE evaluation'],
      images: [],
      links: []
    },

    // ── 5. MarketPulse ─────────────────────────────
    {
      id: 'marketpulse',
      title: 'MarketPulse',
      subtitle: 'Real-time crypto and stock market lakehouse on Microsoft Fabric',
      badge: 'Microsoft Fabric',
      period: 'Jan. 2026 - May 2026',
      role: 'Data engineer and analyst',
      icon: 'img/icons/marketpulse.png',
      summary: 'MarketPulse began as Stock-Predictor, a small Python script that forecast the next close from moving averages. I rebuilt it as an end-to-end Microsoft Fabric platform: live crypto trades streaming into an Eventhouse, a medallion Delta lakehouse for S&P 500 equities, an indicator and backtesting library, data-quality gates, and Direct Lake Power BI dashboards.',
      hero: {
        src: 'img/projects/marketpulse-architecture.svg', width: 480, height: 746,
        alt: 'Architecture diagram: Coinbase WebSocket and market-data REST API feeding Eventstream, Eventhouse and a bronze, silver and gold lakehouse that serves Power BI',
        caption: 'Streaming and batch paths meet in one gold star schema.'
      },
      metrics: [
        { value: '25', label: 'Crypto pairs streaming live' },
        { value: '~4M', label: 'Streaming events per day' },
        { value: '8 s', label: 'Trade-to-tile latency (p95)' },
        { value: '1.1M', label: 'Daily equity bars since 2020' },
        { value: '38', label: 'Data-quality checks per load' }
      ],
      sections: [
        {
          heading: 'Overview',
          paragraphs: [
            'I wanted one platform that could show what the market is doing right now and test whether a strategy would have worked. MarketPulse runs end to end on Microsoft Fabric, with a real-time crypto path and a batch equity path that meet in one gold star schema. Equity history covers about 690 current and former S&P 500 constituents since 2020, so backtests are not flattered by survivorship bias.',
            'MarketPulse is a research and analytics project, not financial advice.'
          ]
        },
        {
          heading: 'How it works',
          steps: [
            'Stream: an Eventstream subscribes to the Coinbase WebSocket ticker and matches channels for 25 pairs, about 4M events a day, and lands them in an Eventhouse KQL database where materialized views roll trades into 1-minute bars.',
            'Batch ingest: Data Factory pipelines pull daily OHLCV bars, splits, dividends and fundamentals from a market-data REST API using watermark-based incremental loads into the bronze layer.',
            'Refine: PySpark notebooks build silver Delta tables with deduplication, schema enforcement, UTC normalization and split- and dividend-adjusted prices, upserted with MERGE.',
            'Model: a gold star schema of fact_price_bar, fact_trade, dim_asset (SCD Type 2 for ticker, sector and index-membership changes), dim_date and dim_exchange. Eventhouse OneLake availability exposes trade data as Delta without copying it.',
            'Compute: an indicator library adds SMA, EMA, RSI, MACD, Bollinger Bands, ATR, VWAP and rolling volatility, using Spark window functions for rolling metrics and grouped applyInPandas for recursive ones like EMA and Wilder-smoothed RSI.',
            'Serve: a Direct Lake semantic model powers Power BI pages for market overview, strategy equity curves, risk and VaR, and correlations, next to real-time crypto tiles that query the Eventhouse directly.'
          ]
        },
        {
          heading: 'Highlights',
          bullets: [
            'Backtesting: a vectorized pandas and NumPy engine shifts every signal one bar to prevent look-ahead bias, charges 10 bps in fees and 5 bps of slippage per trade, and reports Sharpe, Sortino, max drawdown, CAGR and win rate.',
            'Walk-forward validation: parameters are tuned on a rolling 3-year window and tested on the next 6 months. The best moving-average crossover fell from a 1.42 in-sample Sharpe to 0.71 out of sample, a useful check on overfitting.',
            'Data quality: 38 Great Expectations checks per load cover unique keys, non-null prices, OHLC consistency, non-negative volume and row-count drift. A failed suite quarantines the batch and blocks promotion to gold.',
            'Alerting and speed: Data Activator flags any 1-minute return beyond a z-score of 4 and any pipeline failure; the nightly batch finishes in about 12 minutes, and trades reach real-time tiles in about 8 seconds at p95.',
            'DevOps: workspace Git integration plus dev, test and prod deployment pipelines, with deployment rules that rebind lakehouse connections per stage.'
          ]
        }
      ],
      stack: ['Microsoft Fabric', 'Eventstream', 'Eventhouse', 'KQL', 'Data Factory', 'OneLake', 'Delta Lake', 'PySpark', 'Spark SQL', 'pandas', 'NumPy', 'Great Expectations', 'Data Activator', 'Power BI', 'Direct Lake', 'DAX', 'Coinbase WebSocket API', 'REST APIs', 'Git'],
      images: [
        {
          src: 'img/projects/marketpulse-dashboard.svg', width: 480, height: 559,
          alt: 'Power BI dashboard mockup with market overview tiles, a strategy equity curve and a correlation heatmap',
          caption: 'Direct Lake dashboards: market overview, strategy equity curves and correlations.'
        }
      ],
      links: [
        { label: 'Origin: Stock-Predictor', url: 'https://github.com/abel-ninan/Stock-Predictor' },
        { label: 'GitHub profile', url: 'https://github.com/abel-ninan' }
      ]
    },

    // ── 6. Creator Analytics Pipeline ──────────────
    {
      id: 'creator-analytics',
      title: 'Creator Analytics Pipeline',
      subtitle: 'TikTok and e-commerce performance warehouse on a modern data stack',
      badge: 'Modern data stack',
      period: '2026',
      role: 'Analytics engineer',
      icon: 'img/icons/creator-analytics.png',
      summary: 'A warehouse that connects every @historyslides post to the storefront activity it drives. Python extractors orchestrated by Airflow land raw data in Snowflake, dbt models it into tested marts, an LLM tags each caption by topic, and Power BI shows when to post and what to post about. The headline finding: evening posts earned a median of 711K views versus 7.5K in the morning.',
      hero: {
        src: 'img/projects/creator-analytics-pipeline.svg', width: 480, height: 568,
        alt: 'Pipeline diagram: Buffer, TikTok exports and Shopify feeding Airflow, Snowflake raw, staging and marts layers built by dbt, and Power BI',
        caption: 'Extract with Python, orchestrate with Airflow, model with dbt, serve with Power BI.'
      },
      metrics: [
        { value: '~95x', label: 'Evening vs morning median views' },
        { value: '5.3x', label: 'Fri-Sun vs Mon-Thu median views' },
        { value: '711K', label: 'Median views, posts after 6 PM ET' },
        { value: '64', label: 'dbt tests on every run' }
      ],
      sections: [
        {
          heading: 'Overview',
          paragraphs: [
            'Creators usually guess when to post. I wanted the answer from my own data, so I built a small but production-shaped warehouse that joins post performance with storefront orders and refreshes every morning.',
            'Because view counts are heavy-tailed, every comparison uses medians: one viral post should not be able to drag an average and mislead the schedule.'
          ]
        },
        {
          heading: 'How it works',
          steps: [
            'Extract: Python extractors pull post metrics from the Buffer API and TikTok analytics exports, and orders, line items and products from the Shopify Admin API, incrementally by updated-at watermark.',
            'Orchestrate: a daily Apache Airflow DAG runs the extractors, loads files into Snowflake RAW with COPY INTO, tags new captions, runs dbt build and refreshes the Power BI dataset, with retries and failure alerts.',
            'Model: dbt takes raw data to staging to marts, with incremental models for daily post metrics, snapshots that track product price changes as SCD Type 2, and a date and time-of-day dimension normalized to Eastern Time.',
            'Test: 64 dbt tests run on every build, including unique, not-null, relationship and accepted-value tests, source freshness, and a custom test that fails if a post\'s cumulative views ever decrease between loads.',
            'Enrich: an LLM classifies each caption into a fixed topic taxonomy with structured JSON output, and only new or edited captions are sent, keyed by a content hash.',
            'Serve: Power BI shows a day-by-hour posting heatmap, a topic leaderboard, and a views to profile visits to link clicks to orders funnel.'
          ]
        },
        {
          heading: 'Findings',
          bullets: [
            'Across 26 posts in 2026, posts published after 6 PM ET had a median of 711K views, compared with 7.5K for morning posts.',
            'Friday through Sunday posts earned a median of 176K views, compared with 33K Monday through Thursday.',
            'With only 26 posts, I treated these as hypotheses and cross-checked the timing against Metricool\'s study of 2.3M posts and American Time Use Survey data on when people have free time; Buffer\'s 11.4M-post study on posting frequency set how often to post.',
            'Both timing sources pointed the same way, so the findings became a concrete posting schedule.'
          ]
        },
        {
          heading: 'Design notes',
          bullets: [
            'Raw, staging and marts live in separate Snowflake schemas, and an X-Small warehouse with a 60-second auto-suspend keeps compute costs near zero.',
            'Order attribution uses UTM-tagged bio links and is reported as directional, not causal, which keeps the funnel honest.'
          ]
        }
      ],
      stack: ['Python', 'Apache Airflow', 'Snowflake', 'dbt', 'SQL', 'Buffer API', 'Shopify Admin API', 'GraphQL', 'Claude API', 'Power BI', 'DAX', 'Docker'],
      images: [
        {
          src: 'img/projects/creator-analytics-chart.svg', width: 480, height: 457,
          alt: 'Chart comparing median views for evening and morning posts and for weekend and weekday posts',
          caption: 'Median views by posting window: evenings and weekends win by a wide margin.'
        }
      ],
      links: [
        { label: 'GitHub profile', url: 'https://github.com/abel-ninan' }
      ]
    },

    // ── 7. QueryPilot ──────────────────────────────
    {
      id: 'querypilot',
      title: 'QueryPilot',
      subtitle: 'Agentic text-to-SQL data agent with guardrails, evals and MCP',
      badge: 'AI engineering',
      period: '2026',
      role: 'Full-stack AI engineer',
      icon: 'img/icons/querypilot.png',
      summary: 'QueryPilot lets anyone ask a question in plain English and get back a correct, safe SQL answer with a chart. Behind the chat UI, an agent retrieves the right tables, writes SQL, validates it through an AST-level guardrail layer, executes it read-only and fixes its own mistakes. A 300-question golden set gates every pull request in CI.',
      hero: {
        src: 'img/projects/querypilot-architecture.svg', width: 480, height: 821,
        alt: 'Architecture diagram: React chat UI streaming from a FastAPI agent that uses an MCP server, pgvector retrieval, sqlglot guardrails, Postgres and a Redis cache',
        caption: 'Plan, generate, validate, execute, self-correct, answer.'
      },
      metrics: [
        { value: '87.7%', label: 'Execution accuracy (61.3% zero-shot baseline)' },
        { value: '300', label: 'Golden questions gating CI' },
        { value: '4.8 s', label: 'p95 end-to-end latency' },
        { value: '34%', label: 'Redis cache hit rate' },
        { value: '0', label: 'Unsafe queries executed in red-team suite' }
      ],
      sections: [
        {
          heading: 'Overview',
          paragraphs: [
            'Text-to-SQL demos look easy until they meet a real schema: dozens of tables, ambiguous column names, and users who can type anything. QueryPilot treats the LLM as one component in an engineered system, with retrieval, validation, guardrails, evaluation and observability around it.',
            'It runs against a synthetic e-commerce warehouse of 42 tables and about 12M rows in Postgres. The same tools the agent uses are exposed through an MCP server, so any MCP client can query the database safely.'
          ]
        },
        {
          heading: 'How it works',
          steps: [
            'Retrieve: table and column descriptions plus sample values are embedded and stored in Postgres with pgvector; each question pulls the top matching tables, expanded along foreign-key join paths, so the prompt holds about 6 relevant tables instead of 42.',
            'Plan and generate: the agent drafts a short plan, then writes SQL using MCP tools: list_schemas, describe_table, run_readonly_query and explain_query.',
            'Validate: sqlglot parses the query to an AST and enforces a single read-only SELECT, injects or clamps a LIMIT and masks PII columns; the validator then runs EXPLAIN on Postgres to reject queries over a cost threshold.',
            'Execute and self-correct: the query runs under a read-only role with a statement timeout; on any error or validator rejection, the message is fed back and the agent retries up to 3 times.',
            'Answer: the result streams to the React and TypeScript chat UI over Server-Sent Events with the SQL, a results table and a declarative chart spec.'
          ]
        },
        {
          heading: 'Highlights',
          bullets: [
            'Evaluation harness: a 300-question golden set across four difficulty tiers measures execution accuracy by comparing result sets, and GitHub Actions fails any pull request that drops accuracy by more than 2 points against main.',
            'Results: 87.7% execution accuracy (263 of 300) versus 61.3% (184 of 300) for a zero-shot baseline given the full schema; self-correction alone recovered 41 first-attempt failures.',
            'Defense in depth: AST guardrails, a read-only database role, a function denylist, and prompt-injection filtering that treats retrieved values and query results as data, never instructions. A 120-prompt red-team suite produced zero executed writes.',
            'Performance and observability: a Redis cache keyed on normalized SQL and schema version serves 34% of requests, p95 latency is 4.8 seconds uncached, and OpenTelemetry traces every retrieval, model call, validation and query.',
            'Shipping: Dockerized and deployed to Azure Container Apps, with pytest unit and integration tests and Playwright end-to-end tests of the chat UI.'
          ]
        }
      ],
      stack: ['Python', 'FastAPI', 'React', 'TypeScript', 'Server-Sent Events', 'Model Context Protocol (MCP)', 'Claude API', 'PostgreSQL', 'pgvector', 'sqlglot', 'Redis', 'Docker', 'Azure Container Apps', 'OpenTelemetry', 'GitHub Actions', 'pytest', 'Playwright'],
      images: [
        {
          src: 'img/projects/querypilot-demo.svg', width: 480, height: 589,
          alt: 'QueryPilot chat demo showing a plain-English question, the generated SQL, a ranked results table and a one-line answer',
          caption: 'A question in, validated SQL and a ranked table out.'
        }
      ],
      links: [
        { label: 'GitHub profile', url: 'https://github.com/abel-ninan' }
      ]
    }
  ],

  // MS-DOS WHOAMI output: plain text, each line 60 chars max
  dos: {
    whoami: [
      'ABEL NINAN',
      'Data Analyst at CEFCU',
      '----------------------------------------',
      'Education : B.S. Business Information Systems',
      '            Minor in Data Analytics',
      '            Illinois State University, 2024',
      'Focus     : SQL, Power BI, Microsoft Fabric, SSIS',
      'Builds    : iOS apps, data pipelines, AI agents',
      'Shipped   : HairMaxxx on the App Store (5.0 stars)',
      'Creator   : @historyslides, 508.6K TikTok followers',
      'Certs     : AWS Data Engineer - Associate,',
      '            AWS AI Practitioner, AWS Cloud',
      '            Practitioner, CSM, CSPO',
      'Leadership: Chair, Student Technology Advisory',
      '            Committee (Illinois State)',
      'Off hours : Wrestling coach, BJJ, Muay Thai',
      'Contact   : abelninan@outlook.com',
      'GitHub    : github.com/abel-ninan'
    ]
  },

  certificationsTxt: [
    'CERTIFICATIONS',
    '==============',
    '',
    'AWS Certified Data Engineer - Associate',
    '  Issuer: Amazon Web Services',
    '  Issued: November 2024',
    '  Data ingestion and transformation,',
    '  pipeline orchestration, data stores,',
    '  data quality, security and governance',
    '  on AWS.',
    '',
    'AWS Certified AI Practitioner',
    '  Issuer: Amazon Web Services',
    '  Issued: September 2024',
    '  AI, machine learning and generative AI',
    '  concepts, use cases and responsible AI',
    '  on AWS.',
    '',
    'AWS Certified Cloud Practitioner',
    '  Issuer: Amazon Web Services',
    '  Issued: March 2024',
    '  Core AWS services, cloud architecture,',
    '  security, pricing and support.',
    '',
    'Certified Scrum Master (CSM)',
    '  Issuer: Scrum Alliance',
    '  Issued: February 2024',
    '  Facilitating Scrum teams, events and',
    '  continuous improvement.',
    '',
    'Certified Scrum Product Owner (CSPO)',
    '  Issuer: Scrum Alliance',
    '  Issued: February 2024',
    '  Backlog ownership, prioritization and',
    '  delivering value to stakeholders.',
    '',
    'CONFERENCES',
    '===========',
    '',
    'FabCon 2026',
    '  Microsoft Fabric Community Conference',
    '  Atlanta, GA - March 2026',
    '  Focus: Power BI, AI copilots and data',
    '  agents, MCP, and SQL + AI.',
    ''
  ].join('\n')
};
