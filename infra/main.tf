locals {
  name_prefix  = "${var.project}-${var.environment}"
  storage_name = lower(replace("${var.project}${var.environment}", "/[^a-z0-9]/", ""))
}

resource "azurerm_resource_group" "main" {
  name     = local.name_prefix
  location = var.location
}

resource "azurerm_storage_account" "main" {
  name                            = local.storage_name
  resource_group_name             = azurerm_resource_group.main.name
  location                        = azurerm_resource_group.main.location
  account_tier                    = "Standard"
  account_replication_type        = "LRS"
  min_tls_version                 = "TLS1_2"
  allow_nested_items_to_be_public = false
  shared_access_key_enabled       = true
}

resource "azurerm_storage_container" "releases" {
  name                  = "api-releases"
  storage_account_id    = azurerm_storage_account.main.id
  container_access_type = "private"
}

resource "azurerm_storage_table" "state" {
  name                 = "ApiState"
  storage_account_name = azurerm_storage_account.main.name
}

resource "azurerm_email_communication_service" "main" {
  name                = "${local.name_prefix}-email"
  resource_group_name = azurerm_resource_group.main.name
  data_location       = var.email_data_location
}

resource "azurerm_email_communication_service_domain" "custom" {
  name             = var.custom_domain
  email_service_id = azurerm_email_communication_service.main.id
  domain_management = "CustomerManaged"
}

resource "azurerm_communication_service" "main" {
  name                = "${local.name_prefix}-communication"
  resource_group_name = azurerm_resource_group.main.name
  data_location       = var.email_data_location
}

resource "azurerm_log_analytics_workspace" "main" {
  name                = "${local.name_prefix}-logs"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  daily_quota_gb      = 0.1
}

resource "azurerm_application_insights" "main" {
  name                = "${local.name_prefix}-insights"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "Node.JS"
  sampling_percentage = 10
}

resource "azurerm_service_plan" "flex" {
  name                = "${local.name_prefix}-plan"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = "FC1"
}

resource "azurerm_function_app_flex_consumption" "api" {
  name                = "${local.name_prefix}-api"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  service_plan_id     = azurerm_service_plan.flex.id

  storage_container_type      = "blobContainer"
  storage_container_endpoint  = "${azurerm_storage_account.main.primary_blob_endpoint}${azurerm_storage_container.releases.name}"
  storage_authentication_type = "SystemAssignedIdentity"

  runtime_name           = "node"
  runtime_version        = "24"
  maximum_instance_count = 2
  instance_memory_in_mb  = 512
  https_only             = true

  identity {
    type = "SystemAssigned"
  }

  site_config {
    minimum_tls_version            = "1.2"
    http2_enabled                  = true
    ip_restriction_default_action  = "Deny"
    scm_use_main_ip_restriction    = false
    application_insights_connection_string = azurerm_application_insights.main.connection_string

    cors {
      allowed_origins = ["https://${var.custom_domain}"]
    }

    dynamic "ip_restriction" {
      for_each = var.cloudflare_ipv4_cidrs
      content {
        name       = "cloudflare-${ip_restriction.key}"
        priority   = 100 + ip_restriction.key
        action     = "Allow"
        ip_address = ip_restriction.value
      }
    }
  }

  app_settings = {
    AzureWebJobsStorage__accountName = azurerm_storage_account.main.name
    TABLE_ENDPOINT                   = azurerm_storage_account.main.primary_table_endpoint
    API_STATE_TABLE                  = azurerm_storage_table.state.name
    EMAIL_ENDPOINT                   = "https://${azurerm_communication_service.main.name}.europe.communication.azure.com"
    EMAIL_SENDER                     = var.email_sender
    EMAIL_RECIPIENT                  = var.email_recipient
    ALLOWED_ORIGINS                  = "https://${var.custom_domain}"
    API_HASH_SECRET                  = var.api_hash_secret
  }
}

resource "azurerm_role_assignment" "storage_blob_owner" {
  scope                = azurerm_storage_account.main.id
  role_definition_name = "Storage Blob Data Owner"
  principal_id         = azurerm_function_app_flex_consumption.api.identity[0].principal_id
}

resource "azurerm_role_assignment" "storage_queue_contributor" {
  scope                = azurerm_storage_account.main.id
  role_definition_name = "Storage Queue Data Contributor"
  principal_id         = azurerm_function_app_flex_consumption.api.identity[0].principal_id
}

resource "azurerm_role_assignment" "storage_table_contributor" {
  scope                = azurerm_storage_account.main.id
  role_definition_name = "Storage Table Data Contributor"
  principal_id         = azurerm_function_app_flex_consumption.api.identity[0].principal_id
}

resource "azurerm_role_definition" "email_client" {
  name        = "${local.name_prefix}-email-client"
  scope       = azurerm_resource_group.main.id
  description = "Allows Function App Managed Identity to send email through Azure Communication Services."

  permissions {
    actions = [
      "Microsoft.Communication/CommunicationServices/Read",
      "Microsoft.Communication/CommunicationServices/Write",
    ]
    not_actions = []
  }

  assignable_scopes = [
    azurerm_resource_group.main.id,
  ]
}

resource "azurerm_role_assignment" "email_sender" {
  scope              = azurerm_communication_service.main.id
  role_definition_id = azurerm_role_definition.email_client.role_definition_resource_id
  principal_id       = azurerm_function_app_flex_consumption.api.identity[0].principal_id
}

resource "azurerm_static_web_app" "web" {
  name                = local.name_prefix
  resource_group_name = azurerm_resource_group.main.name
  location            = var.static_web_app_location
  sku_tier            = "Free"
  sku_size            = "Free"
}

resource "azurerm_user_assigned_identity" "github" {
  name                = "${local.name_prefix}-github"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
}

resource "azurerm_federated_identity_credential" "github_production" {
  name                = "github-environment"
  resource_group_name = azurerm_resource_group.main.name
  parent_id           = azurerm_user_assigned_identity.github.id
  audience            = ["api://AzureADTokenExchange"]
  issuer              = "https://token.actions.githubusercontent.com"
  subject             = "repo:${var.github_repository}:environment:${var.environment}"
}

resource "azurerm_role_assignment" "github_deploy_api" {
  scope                = azurerm_function_app_flex_consumption.api.id
  role_definition_name = "Website Contributor"
  principal_id         = azurerm_user_assigned_identity.github.principal_id
}

resource "azurerm_monitor_action_group" "operations" {
  name                = "${local.name_prefix}-operations"
  resource_group_name = azurerm_resource_group.main.name
  short_name          = "lanafoxops"

  email_receiver {
    name                    = "owner"
    email_address           = var.alert_email
    use_common_alert_schema = true
  }
}

resource "azurerm_monitor_metric_alert" "http_5xx" {
  name                = "${local.name_prefix}-api-http5xx"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_function_app_flex_consumption.api.id]
  description         = "Alert when Function App returns more than 2 HTTP 5xx responses within 5 minutes."
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.Web/sites"
    metric_name      = "Http5xx"
    aggregation      = "Total"
    operator         = "GreaterThan"
    threshold        = 2
  }

  action {
    action_group_id = azurerm_monitor_action_group.operations.id
  }
}

resource "azurerm_consumption_budget_resource_group" "monthly" {
  name              = "${local.name_prefix}-monthly-budget"
  resource_group_id = azurerm_resource_group.main.id
  amount            = var.monthly_budget_amount
  time_grain        = "Monthly"

  time_period {
    start_date = var.monthly_budget_start_date
  }

  notification {
    enabled        = true
    threshold      = 80
    operator       = "GreaterThanOrEqualTo"
    threshold_type = "Actual"
    contact_emails = [var.alert_email]
  }

  notification {
    enabled        = true
    threshold      = 100
    operator       = "GreaterThanOrEqualTo"
    threshold_type = "Actual"
    contact_emails = [var.alert_email]
  }
}

