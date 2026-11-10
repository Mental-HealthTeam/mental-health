variable "aws_region" {
  description = "Region AWS"
  type        = string
}

variable "environment" {
  description = "Environment(test or prod)"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "instance_type" {
  description = "Instance Type"
  type        = string
}

variable "volume_size" {
  description = "Volume Size"
  type        = string
}

variable "enable_ses" {
  description = "Enable Amazon SES for production"
  type        = bool
  default     = false
}

variable "ses_domain" {
  description = "Domain used for sending emails through Amazon SES"
  type        = string
  default     = ""
}

variable "ses_sender_email" {
  description = "Verified sender email address for Amazon SES"
  type        = string
  default     = ""
}