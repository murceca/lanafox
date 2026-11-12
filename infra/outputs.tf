output "resource_group_name" {
  description = "Azure Resource Group name"
  value       = azurerm_resource_group.main.name
}

output "static_web_app_default_host_name" {
  description = "Default hostname of the Azure Static Web App"
  value       = azurerm_static_web_app.web.default_host_name
}

output "function_app_name" {
  description = "Azure Function App name"
  value       = azurerm_function_app_flex_consumption.api.name
}

output "function_app_default_hostname" {
  description = "Default hostname of the Azure Function App"
  value       = azurerm_function_app_flex_consumption.api.default_hostname
}

output "github_oidc_client_id" {
  description = "Client ID of the GitHub Actions user-assigned managed identity"
  value       = azurerm_user_assigned_identity.github.client_id
}

