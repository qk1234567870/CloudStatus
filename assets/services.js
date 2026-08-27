window.CLOUDSTATUS_SERVICES = [
  {
    "id": "cloudflare",
    "name": "Cloudflare",
    "desc": "全球最大 CDN、DNS 與網路安全平台",
    "category": "cloud",
    "page": "https://www.cloudflarestatus.com",
    "sources": [
      {
        "type": "statuspage",
        "url": "https://www.cloudflarestatus.com/api/v2/incidents.json",
        "label": "官方 API"
      },
      {
        "type": "reader",
        "url": "https://www.cloudflarestatus.com",
        "label": "Reader"
      }
    ]
  },
  {
    "id": "github",
    "name": "GitHub",
    "desc": "全球最大的程式碼託管與開發者平台",
    "category": "developer",
    "page": "https://www.githubstatus.com",
    "sources": [
      {
        "type": "statuspage",
        "url": "https://www.githubstatus.com/api/v2/incidents.json",
        "label": "官方 API"
      },
      {
        "type": "reader",
        "url": "https://www.githubstatus.com",
        "label": "Reader"
      }
    ]
  },
  {
    "id": "openai",
    "name": "OpenAI",
    "desc": "ChatGPT 與大語言模型 API 服務商",
    "category": "ai",
    "page": "https://status.openai.com",
    "sources": [
      {
        "type": "statuspage",
        "url": "https://status.openai.com/api/v2/incidents.json",
        "label": "官方 API"
      },
      {
        "type": "reader",
        "url": "https://status.openai.com",
        "label": "Reader"
      }
    ]
  },
  {
    "id": "google-cloud",
    "name": "Google Cloud",
    "desc": "Google 雲端運算與數據分析平台",
    "category": "cloud",
    "page": "https://status.cloud.google.com",
    "sources": [
      {
        "type": "gcp",
        "url": "https://status.cloud.google.com/incidents.json",
        "label": "官方 JSON"
      },
      {
        "type": "reader",
        "url": "https://status.cloud.google.com",
        "label": "Reader"
      }
    ]
  },
  {
    "id": "aws",
    "name": "AWS",
    "desc": "Amazon Web Services",
    "category": "cloud",
    "page": "https://health.aws.amazon.com/health/status",
    "sources": [
      {
        "type": "rss",
        "url": "https://status.aws.amazon.com/rss/all.rss",
        "label": "官方 RSS"
      },
      {
        "type": "reader",
        "url": "https://health.aws.amazon.com/health/status",
        "label": "Health Dashboard"
      }
    ]
  },
  {
    "id": "azure",
    "name": "Microsoft Azure",
    "desc": "Microsoft 企業級雲端平台",
    "category": "cloud",
    "page": "https://azure.status.microsoft/status",
    "sources": [
      {
        "type": "reader",
        "url": "https://azure.status.microsoft/status",
        "label": "官方 Status"
      },
      {
        "type": "reader",
        "url": "https://backup.azure.status.microsoft/",
        "label": "官方 Backup"
      }
    ]
  },
  {
    "id": "apple",
    "name": "Apple Services",
    "desc": "Apple 系統與雲端服務",
    "category": "platform",
    "page": "https://www.apple.com/support/systemstatus/",
    "sources": [
      {
        "type": "reader",
        "url": "https://www.apple.com/support/systemstatus/?viewlocale=en_US",
        "label": "官方 System Status"
      }
    ]
  },
  {
    "id": "oracle",
    "name": "Oracle Cloud",
    "desc": "Oracle Cloud Infrastructure",
    "category": "cloud",
    "page": "https://ocistatus.oraclecloud.com/",
    "sources": [
      {
        "type": "reader",
        "url": "https://ocistatus.oraclecloud.com/incidents/",
        "label": "官方 Incident History"
      },
      {
        "type": "reader",
        "url": "https://ocistatus.oraclecloud.com/",
        "label": "官方 Status"
      }
    ]
  },
  {
    "id": "bandwagonhost",
    "name": "BandwagonHost",
    "desc": "VPS 與網路基礎設施",
    "category": "hosting",
    "page": "https://bwhstatus.com/",
    "sources": [
      {
        "type": "reader",
        "url": "https://bwhstatus.com/",
        "label": "官方 Status"
      }
    ]
  },
  {
    "id": "dmit",
    "name": "DMIT",
    "desc": "全球高階網路與雲端服務",
    "category": "hosting",
    "page": "https://www.dmit.io/serverstatus.php",
    "sources": [
      {
        "type": "reader",
        "url": "https://www.dmit.io/serverstatus.php",
        "label": "官方 Server Status"
      },
      {
        "type": "reader",
        "url": "https://t.me/s/DMIT_INC",
        "label": "Telegram 備援"
      }
    ]
  },
  {
    "id": "equinix",
    "name": "Equinix",
    "desc": "全球大型數據中心與機房互聯平台",
    "category": "datacenter",
    "page": "https://www.equinix.com/contact-us/customer-support",
    "sources": [
      {
        "type": "reader",
        "url": "https://www.equinix.com/contact-us/customer-support",
        "label": "官方支援頁"
      }
    ]
  },
  {
    "id": "digital-realty",
    "name": "Digital Realty",
    "desc": "全球大型數據中心與互聯基礎設施",
    "category": "datacenter",
    "page": "https://status.digitalrealty.com/",
    "sources": [
      {
        "type": "reader",
        "url": "https://status.digitalrealty.com/",
        "label": "官方 Status"
      }
    ]
  },
  {
    "id": "ntt-gdc",
    "name": "NTT GDC",
    "desc": "全球數據中心與園區基礎設施",
    "category": "datacenter",
    "page": "https://services.global.ntt/",
    "sources": [
      {
        "type": "reader",
        "url": "https://services.global.ntt/",
        "label": "官方頁"
      }
    ]
  },
  {
    "id": "arelion",
    "name": "Arelion (Telia)",
    "desc": "全球 Tier-1 國際 IP 骨幹網",
    "category": "backbone",
    "page": "https://www.arelion.com/",
    "sources": [
      {
        "type": "reader",
        "url": "https://www.arelion.com/",
        "label": "官方頁"
      }
    ]
  },
  {
    "id": "ntt-global-network",
    "name": "NTT Global Network",
    "desc": "全球 Tier-1 IP 骨幹與跨洋網路",
    "category": "backbone",
    "page": "https://www.nttdata.com/global/en/services/connectivity/global-ip-network",
    "sources": [
      {
        "type": "reader",
        "url": "https://www.nttdata.com/global/en/services/connectivity/global-ip-network",
        "label": "官方頁"
      }
    ]
  },
  {
    "id": "cogent",
    "name": "Cogent",
    "desc": "全球大型 IP Transit 與頻寬批發網路",
    "category": "backbone",
    "page": "https://status.cogentco.com/",
    "sources": [
      {
        "type": "reader",
        "url": "https://status.cogentco.com/",
        "label": "官方 Network Status"
      }
    ]
  }
];
