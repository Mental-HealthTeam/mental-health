resource "aws_ses_domain_identity" "main" {
  count = var.environment == "prod" && var.enable_ses && var.ses_domain != "" ? 1 : 0

  domain = var.ses_domain
}


resource "aws_ses_domain_dkim" "main" {
  count = var.environment == "prod" && var.enable_ses && var.ses_domain != "" ? 1 : 0

  domain = aws_ses_domain_identity.main[0].domain
}

resource "aws_ses_email_identity" "sender" {
  count = var.environment == "prod" && var.enable_ses && var.ses_sender_email != "" ? 1 : 0

  email = var.ses_sender_email
}