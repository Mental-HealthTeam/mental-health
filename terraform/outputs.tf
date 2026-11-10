output "server_public_ip" {
  value = aws_eip.app_server.public_ip
}

output "server_public_dns" {
  description = "Public DNS name of the server"
  value       = aws_instance.app_server.public_dns
}

output "private_key" {
  value     = tls_private_key.ssh_key.private_key_pem
  sensitive = true
}

output "ses_domain_verification_token" {
  description = "DNS TXT verification token for SES domain identity"
  value       = try(aws_ses_domain_identity.main[0].verification_token, null)
}

output "ses_dkim_tokens" {
  description = "DKIM tokens for SES domain identity"
  value       = try(aws_ses_domain_dkim.main[0].dkim_tokens, [])
}

output "ses_sender_email" {
  description = "Configured SES sender email"
  value       = var.ses_sender_email
}