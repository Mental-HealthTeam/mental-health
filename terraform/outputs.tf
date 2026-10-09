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