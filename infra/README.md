# Azure & Cloudflare Infrastructure Setup Guide

This directory contains the step-by-step **manual Azure Portal and Cloudflare setup instructions** as well as the matching **reference Terraform configuration** (`*.tf`) for the single-`production` low-cost architecture.

## Architecture & Cost Guardrails

- **Single Azure Environment:** Only a single **`production`** environment is allocated in Azure. Pre-release testing runs locally (`npm run preview` + `npm run dev:api`) and in GitHub Actions CI (`build-project.yml`), cutting fixed cloud storage and alert overhead in half.
- **Cost & DDoS Protection:**
  - **Azure Static Web Apps (`Free` SKU):** €0/month with a hard 100 GB/month bandwidth cap ($0 overage risk).
  - **Cloudflare Free DNS/CDN/WAF:** Placed in front of both frontend (`lanafox.eu`) and API (`api.lanafox.eu`) to cache static assets, redirect `www.lanafox.eu` → `https://lanafox.eu`, and block `/api/contact` floods (`> 5 POST req/min` per IP) at the edge for €0.
  - **Azure Functions Flex Consumption (`FC1`, Node 24 LTS):** `0` always-ready instances (scales to zero when idle), capped at `2` maximum instances (`512 MB`), `http_concurrency = 4`, with inbound IP restrictions allowing **only** Cloudflare edge IPv4 ranges and denying direct `*.azurewebsites.net` bypasses.
  - **Azure Storage (`Standard LRS`):** Holds the `api-releases` deployment container and `ApiState` table (24-hour idempotency claims + hourly rate-limit counters). Protected by an in-memory `limitedKeys` pre-check in `@lanafox/api` so floods do not trigger repeated Table Storage transactions.
  - **Secret Storage:** Uses the encrypted Function App setting `API_HASH_SECRET` (€0/month; no separate Azure Key Vault required).
  - **Transactional Email:** Azure Communication Services (ACS) Email bounded in code to `10` emails/hour globally and `3` emails/hour per sender.
  - **Observability & Alerts:** Log Analytics (`PerGB2018`) capped at `0.1 GB/day` (~3 GB/month max, within the 5 GB/month free tier), 30-day retention, `10%` Application Insights sampling, one `Http5xx` metric alert (~€0.10/month), and Cost Management budget alerts at 80% and 100% (no paid hourly Scheduled Query Log Alert rules).

---

## Option A: Step-by-Step Manual Setup (Azure Portal & Cloudflare)

### 1. Create a Resource Group
1. Open **Resource groups** → **Create**.
2. **Name:** `lanafox-production`
3. **Region:** Pick an EU region that supports Azure Functions Flex Consumption with Node 24 LTS (e.g., *Sweden Central*, *West Europe*, or *Germany West Central*).

---

### 2. Create the Storage Account
1. Open **Storage accounts** → **Create** (in `lanafox-production`).
2. **Name:** `lanafoxproduction` (lowercase letters/numbers only).
3. **Performance:** `Standard` | **Redundancy:** `Locally-redundant storage (LRS)`.
4. **Advanced tab:**
   - Uncheck **Allow enabling anonymous access on individual containers**.
   - Set **Minimum TLS version** to `Version 1.2`.
5. After creation, open the Storage Account:
   - Go to **Data storage → Containers** → **+ Container**: create a private container named `api-releases`.
   - Go to **Data storage → Tables** → **+ Table**: create a table named `ApiState`.

---

### 3. Configure Email (Azure Communication Services)
1. **Create Email Service:**
   - Search for **Email Communication Services** → **Create** (in `lanafox-production`).
   - **Name:** `lanafox-production-email` | **Data location:** `Europe`.
2. **Verify Custom Domain:**
   - Inside `lanafox-production-email`, go to **Provision domains** → **Add domain** → **Custom domain**.
   - Enter `lanafox.eu` and follow the wizard to add the **TXT** (ownership + SPF) and **CNAME** (DKIM + DKIM2) records to Cloudflare DNS (keep them **DNS only / grey cloud**).
   - Once verified, open the domain → **MailFrom addresses** and note or add your sender address (e.g., `DoNotReply@lanafox.eu` or `contact@lanafox.eu`).
3. **Create Communication Service & Link Domain:**
   - Search for **Communication Services** → **Create** (in `lanafox-production`).
   - **Name:** `lanafox-production-communication` | **Data location:** `Europe`.
   - Open the resource → **Email → Domains** → **Connect domain**, and select your verified `lanafox.eu` domain.

---

### 4. Create Log Analytics & Application Insights
1. **Log Analytics Workspace:**
   - Search for **Log Analytics workspaces** → **Create**.
   - **Name:** `lanafox-production-logs` | **Pricing tier:** `Pay-as-you-go (PerGB2018)`.
   - After creation, open the workspace:
     - **Usage and estimated costs → Data Retention:** set to `30 days`.
     - **Usage and estimated costs → Daily cap:** turn **On** and set to `0.1` GB/day (~3 GB/month max, staying inside the 5 GB/month free tier).
2. **Application Insights:**
   - Search for **Application Insights** → **Create**.
   - **Name:** `lanafox-production-insights` | **Workspace:** select `lanafox-production-logs`.
   - After creation, go to **Usage and estimated costs → Data sampling** and set to `10%`.

---

### 5. Create the Function App (API)
1. Search for **Function App** → **Create** → select **Flex Consumption**.
2. **Basics:**
   - **Name:** `lanafox-production-api`
   - **Runtime stack:** `Node.js` | **Version:** `24 LTS`
   - **Instance size:** `512 MB`
3. **Storage:** Select `lanafoxproduction` (use `api-releases` deployment container if prompted).
4. **Monitoring:** Enable Application Insights and select `lanafox-production-insights`.
5. After creation, open `lanafox-production-api` and configure:
   - **Settings → Identity:** Under **System assigned**, set Status to **On** and click **Save**.
   - **Settings → Scale and concurrency:**
     - **Maximum instance count:** `2`
     - **Always ready instances:** `0`
     - **HTTP concurrency:** `4`
   - **Settings → Configuration (General settings):**
     - **HTTPS Only:** `On`
     - **Minimum Inbound TLS Version:** `1.2`
     - **SCM Basic Auth Publishing Credentials:** `Off`
   - **Settings → Networking → Inbound Traffic (Public network access / Access restrictions):**
     - Add **Allow** rules for Cloudflare IPv4 edge ranges (`173.245.48.0/20`, `103.21.244.0/22`, `103.22.200.0/22`, `103.31.4.0/22`, `141.101.64.0/18`, `108.162.192.0/18`, `190.93.240.0/20`, `188.114.96.0/20`, `197.234.240.0/22`, `198.41.128.0/17`, `162.158.0.0/15`, `104.16.0.0/13`, `104.24.0.0/14`, `172.64.0.0/13`, `131.0.72.0/22`) and set **Unmatched rule action** to **Deny** so attackers cannot bypass Cloudflare by hitting `*.azurewebsites.net` directly.
   - **Settings → Custom domains:** Bind `api.lanafox.eu` (with a free Azure App Service Managed Certificate) so `/api/*` endpoints are served through Cloudflare.
   - **API → CORS:** Remove `*` and add `https://lanafox.eu`.
   - **Settings → Environment variables (App settings):** Add the following settings (generate `API_HASH_SECRET` locally with `openssl rand -hex 32`; no separate Key Vault resource is required):

| Name | Value |
| :--- | :--- |
| `AzureWebJobsStorage__accountName` | `lanafoxproduction` |
| `TABLE_ENDPOINT` | `https://lanafoxproduction.table.core.windows.net/` |
| `API_STATE_TABLE` | `ApiState` |
| `EMAIL_ENDPOINT` | `https://lanafox-production-communication.europe.communication.azure.com` *(copy exact hostname from ACS Overview)* |
| `EMAIL_SENDER` | `<your-verified-sender>@lanafox.eu` |
| `EMAIL_RECIPIENT` | `contact@lanafox.eu` |
| `ALLOWED_ORIGINS` | `https://lanafox.eu` |
| `API_HASH_SECRET` | `<random-secret-at-least-32-characters>` |

*(Note: If Azure added `AzureWebJobsStorage` as a connection string, delete `AzureWebJobsStorage` so the Function uses `AzureWebJobsStorage__accountName` with Managed Identity.)*

---

### 6. Grant Managed Identity Permissions (RBAC)
Give the Function App (`lanafox-production-api`) permission to use Storage and Email without API keys:

1. **Storage Permissions:**
   - Open your Storage Account (`lanafoxproduction`) → **Access Control (IAM)** → **Add role assignment**.
   - Assign these **3 roles** to **Managed identity** → `lanafox-production-api`:
     - `Storage Blob Data Owner`
     - `Storage Queue Data Contributor`
     - `Storage Table Data Contributor`
2. **Email Permissions:**
   - Open your Resource Group (`lanafox-production`) → **Access Control (IAM)** → **Add** → **Add custom role**.
   - **Name:** `lanafox-production-email-client`
   - **Permissions:** Add `Microsoft.Communication/CommunicationServices/Read` and `Microsoft.Communication/CommunicationServices/Write`.
   - Open `lanafox-production-communication` → **Access Control (IAM)** → **Add role assignment**, and assign `lanafox-production-email-client` to **Managed identity** → `lanafox-production-api`.

---

### 7. Create the Static Web App (Frontend)
1. Search for **Static Web Apps** → **Create** (in `lanafox-production`).
2. **Name:** `lanafox-production` | **Plan type:** `Free`.
3. **Deployment details:** Select **Other** (deployments are uploaded as pre-built artifacts from GitHub Actions or CLI).
4. **Region:** Select the closest available region (e.g., *West Europe*).
5. After creation:
   - Go to **Overview → Manage deployment token** and copy the token for your GitHub `SWA_DEPLOYMENT_TOKEN` secret.
   - Go to **Settings → Custom domains** → **+ Add** → **Custom domain on other DNS** to bind `lanafox.eu` (see Step 8 for Cloudflare setup).

---

### 8. Configure Cloudflare Free DNS, CDN & WAF
Put Cloudflare's Free plan in front of Azure to absorb DDoS spikes (protecting SWA's 100 GB/month quota from suspension and blocking API floods at the edge) and handle `www` → root redirects:

1. **Validate Domain in Azure SWA (Grey Cloud First):**
   - In Cloudflare **DNS → Records**, add the `TXT` validation record and the `CNAME` record (`lanafox.eu` → `<your-swa>.azurestaticapps.net`) with Proxy status set to **DNS only (grey cloud)**.
   - Wait for Azure Static Web Apps (**Custom domains**) to show status **Validated**.
2. **Enable Cloudflare Proxy (Orange Cloud):**
   - Once validated in Azure, switch the `lanafox.eu` `CNAME` record in Cloudflare to **Proxied (orange cloud)**.
   - Add a **Proxied (orange cloud)** `CNAME` record for `www` → `lanafox.eu`.
   - Go to Cloudflare **SSL/TLS → Overview** and set encryption mode to **Full (strict)**.
   - *(Keep Azure Communication Services `TXT` / `CNAME` DKIM records set to **DNS only / grey cloud** so email verification stays intact.)*
3. **Canonical `www` → Root Redirect Rule:**
   - Go to Cloudflare **Rules → Redirect Rules** → **Create rule**:
     - **If:** Hostname equals `www.lanafox.eu`
     - **Then:** Dynamic redirect to `concat("https://lanafox.eu", http.request.uri.path)` with status `301`.
4. **Protect `api.lanafox.eu/api/contact` with Cloudflare WAF Rate Limiting:**
   - In Cloudflare **DNS → Records**, add a **Proxied (orange cloud)** `CNAME` record for `api` → `lanafox-production-api.azurewebsites.net`.
   - Go to **Security → WAF → Rate limiting rules** → **Create rule**:
     - **If:** URI Path equals `/api/contact` AND Request Method equals `POST`
     - **Rate:** more than `5` requests per `1 minute` (per IP) → **Block**.
   - This drops request floods at the Cloudflare edge for **€0** before Azure Functions is ever invoked.

---

### 9. Configure GitHub Deployment Identity (For CI/CD)
1. Search for **Managed Identities** → **Create** (in `lanafox-production`).
2. **Name:** `lanafox-production-github`.
3. Open the identity → **Settings → Federated credentials** → **Add credential**:
   - **Scenario:** `GitHub Actions deploying Azure resources`
   - **Organization / Repository:** your GitHub repo (`murceca/lanafox`)
   - **Entity type:** `Environment` | **Environment name:** `production`
   - **Name:** `github-environment`
4. Open the Function App (`lanafox-production-api`) → **Access Control (IAM)** → **Add role assignment**:
   - **Role:** `Website Contributor`
   - **Assign access to:** **Managed identity** → `lanafox-production-github`.

---

### 10. Set Up Budget & Error Alerts
1. **Monthly Budget (Free):**
   - Open the Resource Group (`lanafox-production`) → **Cost Management → Budgets** → **+ Add**.
   - **Amount:** Set your desired monthly alert threshold (confirm billing currency is EUR).
   - **Alert conditions:** Add alerts at `80%` and `100%` of budget sent to your email.
   - *(Note: Azure budgets send email notifications only; they do not automatically cap spending.)*
2. **HTTP 5xx Alert (~€0.10/month):**
   - Open the Function App (`lanafox-production-api`) → **Monitoring → Alerts** → **+ Create → Alert rule**.
   - **Signal:** `Http Server Errors (Http5xx)` | **Threshold:** Static, `Greater than 2` total in `5 minutes`.
   - **Actions:** Create an Action Group (`lanafox-production-operations`) with your email address.
   - *(Omit paid hourly Scheduled Query Log Alert rules to save ~€0.50–€1.50/month; `contact_cleanup_failed` traces remain queryable in Application Insights within the free 5 GB tier.)*

---

## Option B: Reference Terraform Configuration

If you prefer Infrastructure-as-Code over manual Portal clicks, the `*.tf` files in this directory define the exact same single-`production` architecture:

```sh
cd infra
terraform init -backend=false
terraform fmt -check
terraform validate
```

---

## Release Rollback Procedure

Every run of the manual [`.github/workflows/deployment.yml`](../.github/workflows/deployment.yml) workflow uploads a verified `lanafox-release-<sha>` artifact (retained for 30 days) containing `artifacts/web/`, `artifacts/api/`, and `artifacts/release.json` with SHA-256 digests.

To roll back to a previous known-good release without rebuilding:
1. Open **GitHub Actions → `deployment` → Run workflow**.
2. Enter the **GitHub Actions Run ID** of the known-good deployment in the `rollback_run_id` input field and click **Run workflow**.
3. The workflow downloads the verified `lanafox-release-*` artifact, checks `artifacts/release.json`, and redeploys both `artifacts/api` and `artifacts/web`.

