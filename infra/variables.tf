variable "project" {
  description = "Project prefix for Azure resources"
  type        = string
  default     = "lanafox"
}

variable "environment" {
  description = "Single deployment environment name"
  type        = string
  default     = "production"
}

variable "location" {
  description = "Primary EU region supporting Azure Functions Flex Consumption with Node 24 LTS"
  type        = string
  default     = "swedencentral"
}

variable "static_web_app_location" {
  description = "Azure Static Web Apps region"
  type        = string
  default     = "westeurope"
}

variable "email_data_location" {
  description = "Azure Communication Services data location"
  type        = string
  default     = "Europe"
}

variable "custom_domain" {
  description = "Primary public frontend domain"
  type        = string
  default     = "lanafox.eu"
}

variable "email_sender" {
  description = "Verified sender address on the custom domain"
  type        = string
  default     = "DoNotReply@lanafox.eu"
}

variable "email_recipient" {
  description = "Destination inbox for contact form submissions"
  type        = string
  default     = "contact@lanafox.eu"
}

variable "alert_email" {
  description = "Operations email address for HTTP 5xx and monthly budget alerts"
  type        = string
  default     = "contact@lanafox.eu"
}

variable "monthly_budget_amount" {
  description = "Monthly Azure Cost Management budget notification threshold"
  type        = number
  default     = 5
}

variable "monthly_budget_start_date" {
  description = "RFC3339 start date (first day of month) for the budget notification rule"
  type        = string
  default     = "2026-11-01T00:00:00Z"
}

variable "github_repository" {
  description = "GitHub organization/repository allowed to authenticate via OIDC"
  type        = string
  default     = "murceca/lanafox"
}

variable "api_hash_secret" {
  description = "Secret HMAC key (at least 32 characters) stored directly as an encrypted Function App setting"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.api_hash_secret) >= 32
    error_message = "api_hash_secret must be at least 32 characters."
  }
}

variable "cloudflare_ipv4_cidrs" {
  description = "Cloudflare IPv4 edge CIDR blocks allowed to reach the Function App"
  type        = list(string)
  default = [
    "173.245.48.0/20",
    "103.21.244.0/22",
    "103.22.200.0/22",
    "103.31.4.0/22",
    "141.101.64.0/18",
    "108.162.192.0/18",
    "190.93.240.0/20",
    "188.114.96.0/20",
    "197.234.240.0/22",
    "198.41.128.0/17",
    "162.158.0.0/15",
    "104.16.0.0/13",
    "104.24.0.0/14",
    "172.64.0.0/13",
    "131.0.72.0/22",
  ]
}

