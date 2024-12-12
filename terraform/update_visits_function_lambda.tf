resource "aws_iam_role" "lambda_role" {
  name = "update_visits_lambda_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "update_visits_lambda_policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:GetItem"
        ]
        Resource = aws_dynamodb_table.daily_user_visits.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_lambda_function" "update_visits" {
  filename         = "lambda/update_visits.zip"
  function_name    = "update_daily_visits"
  role            = aws_iam_role.lambda_role.arn
  handler         = "update_visits.lambda_handler"
  runtime         = "python3.9"

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.daily_user_visits.name
    }
  }
}
