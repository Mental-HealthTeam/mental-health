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
  type = string
}
