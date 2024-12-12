variable "aws_region" {
  description = "AWS region where resources will be created"
  type        = string
  default     = "eu-west-2"  # Updated from "us-east-1" to "eu-west-2"
}

variable "api_stage" {
  description = "The name of the API Gateway stage"
  type        = string
  default     = "prod" # Optional: Remove if you want to enforce setting via terraform.tfvars
}