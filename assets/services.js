window.CLOUDSTATUS_SERVICES = [
  {
    "id": "cloudflare",
    "name": "Cloudflare",
    "desc": "全球最大 CDN、DNS 與網路安全平台",
    "category": "cloud",
    "page": "https://www.cloudflarestatus.com",
    "parser": "statuspage",
    "sources": [
      {
        "type": "statuspage",
        "url": "https://www.cloudflarestatus.com/api/v2/incidents.json",
        "label": "官方 API",
        "tier": 10,
        "kind": "official-api",
        "priority": 10
      },
      {
        "type": "reader",
        "url": "https://www.cloudflarestatus.com",
        "label": "官方頁 Reader",
        "tier": 50,
        "kind": "official-status",
        "priority": 50
      }
    ]
  },
  {
    "id": "aws",
    "name": "AWS",
    "desc": "Amazon Web Services",
    "category": "cloud",
    "page": "https://health.aws.amazon.com/health/status",
    "parser": "aws",
    "sources": [
      {
        "type": "rss",
        "url": "https://status.aws.amazon.com/rss/all.rss",
        "label": "官方 RSS",
        "tier": 30,
        "kind": "official-rss",
        "priority": 30
      },
      {
        "type": "reader",
        "url": "https://health.aws.amazon.com/health/status",
        "label": "官方 Health Dashboard",
        "tier": 50,
        "kind": "official-status",
        "priority": 50
      }
    ]
  },
  {
    "id": "azure",
    "name": "Microsoft Azure",
    "desc": "Microsoft 企業級雲端平台",
    "category": "cloud",
    "page": "https://azure.status.microsoft/status",
    "parser": "azure",
    "sources": [
      {
        "type": "reader",
        "url": "https://azure.status.microsoft/status",
        "label": "官方 Status",
        "tier": 50,
        "kind": "official-status",
        "priority": 50
      },
      {
        "type": "reader",
        "url": "https://backup.azure.status.microsoft/",
        "label": "官方 Backup Status",
        "tier": 70,
        "kind": "official-backup",
        "priority": 70
      }
    ]
  },
  {
    "id": "google-cloud",
    "name": "Google Cloud",
    "desc": "Google 雲端運算與數據分析平台",
    "category": "cloud",
    "page": "https://status.cloud.google.com",
    "parser": "google-cloud",
    "sources": [
      {
        "type": "gcp",
        "url": "https://status.cloud.google.com/incidents.json",
        "label": "官方 JSON",
        "tier": 20,
        "kind": "official-json",
        "priority": 20
      },
      {
        "type": "reader",
        "url": "https://status.cloud.google.com",
        "label": "官方狀態頁",
        "tier": 50,
        "kind": "official-status",
        "priority": 50
      }
    ]
  },
  {
    "id": "github",
    "name": "GitHub",
    "desc": "全球最大的程式碼託管與開發者平台",
    "category": "developer",
    "page": "https://www.githubstatus.com",
    "parser": "statuspage",
    "sources": [
      {
        "type": "statuspage",
        "url": "https://www.githubstatus.com/api/v2/incidents.json",
        "label": "官方 API",
        "tier": 10,
        "kind": "official-api",
        "priority": 10
      },
      {
        "type": "reader",
        "url": "https://www.githubstatus.com",
        "label": "官方頁 Reader",
        "tier": 50,
        "kind": "official-status",
        "priority": 50
      }
    ]
  },
  {
    "id": "openai",
    "name": "OpenAI",
    "desc": "ChatGPT 與大語言模型 API 服務商",
    "category": "ai",
    "page": "https://status.openai.com",
    "parser": "statuspage",
    "sources": [
      {
        "type": "statuspage",
        "url": "https://status.openai.com/api/v2/incidents.json",
        "label": "官方 API",
        "tier": 10,
        "kind": "official-api",
        "priority": 10
      },
      {
        "type": "reader",
        "url": "https://status.openai.com",
        "label": "官方頁 Reader",
        "tier": 50,
        "kind": "official-status",
        "priority": 50
      }
    ]
  },
  {
    "id": "apple",
    "name": "Apple Services",
    "desc": "Apple 系統與雲端服務",
    "category": "platform",
    "page": "https://www.apple.com/support/systemstatus/",
    "parser": "apple",
    "sources": [
      {
        "type": "apple-json",
        "url": "https://www.apple.com/support/systemstatus/data/system_status_en_US.js",
        "label": "官方 JSON",
        "tier": 20,
        "kind": "official-json",
        "priority": 20
      },
      {
        "type": "reader",
        "url": "https://www.apple.com/support/systemstatus/?viewlocale=en_US",
        "label": "官方 System Status",
        "tier": 50,
        "kind": "official-status",
        "priority": 50
      },
      {
        "type": "apple-backup",
        "url": "https://pingoru.io/providers/apple/outage-history",
        "label": "Pingoru 備援",
        "tier": 80,
        "kind": "trusted-third-party",
        "priority": 80
      }
    ]
  },
  {
    "id": "oracle",
    "name": "Oracle Cloud",
    "desc": "Oracle Cloud Infrastructure",
    "category": "cloud",
    "page": "https://ocistatus.oraclecloud.com/",
    "parser": "oracle",
    "sources": [
      {
        "type": "reader",
        "url": "https://ocistatus.oraclecloud.com/incidents/",
        "label": "官方事件歷史",
        "tier": 40,
        "kind": "official-history",
        "priority": 40
      },
      {
        "type": "reader",
        "url": "https://ocistatus.oraclecloud.com/",
        "label": "官方 Status",
        "tier": 50,
        "kind": "official-status",
        "priority": 50
      }
    ]
  },
  {
    "id": "bandwagonhost",
    "name": "BandwagonHost",
    "desc": "VPS 與網路基礎設施",
    "category": "hosting",
    "page": "https://bwhstatus.com/",
    "parser": "bandwagon",
    "sources": [
      {
        "type": "reader",
        "url": "https://bwhstatus.com/",
        "label": "官方狀態頁",
        "tier": 50,
        "kind": "official-status",
        "priority": 50
      }
    ]
  },
  {
    "id": "dmit",
    "name": "DMIT",
    "desc": "全球高階網路與雲端服務",
    "category": "hosting",
    "page": "https://www.dmit.io/serverstatus.php",
    "parser": "dmit",
    "sources": [
      {
        "type": "reader",
        "url": "https://www.dmit.io/serverstatus.php",
        "label": "官方 Server Status",
        "tier": 50,
        "kind": "official-status",
        "priority": 50
      },
      {
        "type": "reader",
        "url": "https://dmit-abuse-team-temp-security-response.dmit.com/",
        "label": "官方 Security Response",
        "tier": 60,
        "kind": "official-announcement",
        "priority": 60
      },
      {
        "type": "reader",
        "url": "https://t.me/s/DMIT_INC",
        "label": "官方 Telegram 公告",
        "tier": 60,
        "kind": "official-announcement",
        "priority": 60
      }
    ]
  },
  {
    "id": "equinix",
    "name": "Equinix",
    "desc": "全球大型數據中心與機房互聯平台",
    "category": "datacenter",
    "page": "https://equinixproductstatus.statuspage.io/",
    "parser": "equinix",
    "sources": [
      {
        "type": "statuspage",
        "url": "https://equinixproductstatus.statuspage.io",
        "label": "官方 API",
        "kind": "official-api",
        "priority": 10,
        "tier": 10
      },
      {
        "type": "rss",
        "url": "https://equinixproductstatus.statuspage.io/history.rss",
        "label": "官方 RSS",
        "kind": "official-rss",
        "priority": 30,
        "tier": 30
      },
      {
        "type": "reader",
        "url": "https://equinixproductstatus.statuspage.io/history",
        "label": "官方 Incident History",
        "kind": "official-history",
        "priority": 40,
        "tier": 40
      },
      {
        "type": "reader",
        "url": "https://equinixproductstatus.statuspage.io/",
        "label": "官方 Status",
        "kind": "official-status",
        "priority": 50,
        "tier": 50
      }
    ]
  },
  {
    "id": "digital-realty",
    "name": "Digital Realty",
    "desc": "全球大型數據中心與互聯基礎設施",
    "category": "datacenter",
    "page": "https://status.digitalrealty.com/",
    "parser": "digital-realty",
    "sources": [
      {
        "type": "reader",
        "url": "https://status.digitalrealty.com/",
        "label": "官方 System Status",
        "kind": "official-status",
        "priority": 50,
        "tier": 50
      },
      {
        "type": "reader",
        "url": "https://developer.digitalrealty.com/docs/status-maintenance",
        "label": "官方 Status & Maintenance",
        "kind": "official-status",
        "priority": 51,
        "tier": 51
      }
    ]
  },
  {
    "id": "ntt-gdc",
    "name": "NTT GDC",
    "desc": "全球數據中心與園區基礎設施",
    "category": "datacenter",
    "page": "https://services.global.ntt/",
    "parser": "ntt-gdc",
    "sources": [
      {
        "type": "reader",
        "url": "https://services.global.ntt/",
        "label": "官方頁",
        "tier": 50,
        "kind": "official-status",
        "priority": 50
      }
    ],
    "publicStructuredFeed": false
  },
  {
    "id": "arelion",
    "name": "Arelion (Telia)",
    "desc": "全球 Tier-1 國際 IP 骨幹網",
    "category": "backbone",
    "page": "https://www.arelion.com/",
    "parser": "arelion",
    "sources": [
      {
        "type": "reader",
        "url": "https://www.arelion.com/",
        "label": "官方頁",
        "tier": 50,
        "kind": "official-status",
        "priority": 50
      }
    ],
    "publicStructuredFeed": false
  },
  {
    "id": "ntt-global-network",
    "name": "NTT Global Network",
    "desc": "全球 Tier-1 IP 骨幹與跨洋網路",
    "category": "backbone",
    "page": "https://www.nttdata.com/global/en/services/connectivity/global-ip-network",
    "parser": "ntt-global",
    "sources": [
      {
        "type": "reader",
        "url": "https://www.nttdata.com/global/en/services/connectivity/global-ip-network",
        "label": "官方頁",
        "tier": 50,
        "kind": "official-status",
        "priority": 50
      }
    ]
  },
  {
    "id": "cogent",
    "name": "Cogent",
    "desc": "全球大型 IP Transit 與頻寬批發網路",
    "category": "backbone",
    "page": "https://ecogent.cogentco.com/network-status",
    "parser": "cogent",
    "sources": [
      {
        "type": "reader",
        "url": "https://ecogent.cogentco.com/network-status",
        "label": "官方 Network Status",
        "kind": "official-status",
        "priority": 50,
        "tier": 50
      },
      {
        "type": "reader",
        "url": "https://www.cogentco.com/en/sprint-portal",
        "label": "官方 Maintenance 資訊",
        "kind": "official-status",
        "priority": 55,
        "tier": 55
      }
    ]
  }
];
