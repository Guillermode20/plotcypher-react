provider "aws" {
  region = "eu-west-2" # Replace with your desired region
}

resource "aws_dynamodb_table" "daily_user_visits" {
  name           = "plotcypher_daily_user_visits"
  billing_mode   = "PAY_PER_REQUEST"

  hash_key       = "visit_date"
  range_key      = "user_id"

  attribute {
    name = "visit_date"
    type = "S" # S = String
  }

  attribute {
    name = "user_id"
    type = "S" # S = String
  }

  tags = {
    Environment = "Production"
    Project     = "WebsiteAnalytics"
  }
}
