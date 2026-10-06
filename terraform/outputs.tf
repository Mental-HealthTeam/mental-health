output "server_public_ip" {
  description = "Public IP address of the server"
  value       = aws_instance.app_server.public_ip
}

output "server_public_dns" {
  description = "Public DNS name of the server"
  value       = aws_instance.app_server.public_dns
}
