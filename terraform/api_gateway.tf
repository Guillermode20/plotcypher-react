resource "aws_api_gateway_rest_api" "visits_api" {
  name        = "VisitsAPI"
  description = "API Gateway for updating daily visits"
}

resource "aws_api_gateway_resource" "visits_resource" {
  rest_api_id = aws_api_gateway_rest_api.visits_api.id
  parent_id   = aws_api_gateway_rest_api.visits_api.root_resource_id
  path_part   = "visit"
}

resource "aws_api_gateway_method" "post_visit" {
  rest_api_id   = aws_api_gateway_rest_api.visits_api.id
  resource_id   = aws_api_gateway_resource.visits_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id             = aws_api_gateway_rest_api.visits_api.id
  resource_id             = aws_api_gateway_resource.visits_resource.id
  http_method             = aws_api_gateway_method.post_visit.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.update_visits.invoke_arn
  passthrough_behavior    = "WHEN_NO_MATCH"
  content_handling        = "CONVERT_TO_TEXT"
}

resource "aws_lambda_permission" "api_gateway_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.update_visits.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.visits_api.execution_arn}/*/*"
}

resource "aws_api_gateway_deployment" "visits_api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.visits_api.id
  
  triggers = {
    redeployment = sha1(jsonencode(timestamp()))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.lambda_integration,
    aws_api_gateway_integration_response.options
  ]
}

resource "aws_api_gateway_stage" "prod_stage" {
  stage_name    = var.api_stage
  rest_api_id   = aws_api_gateway_rest_api.visits_api.id
  deployment_id = aws_api_gateway_deployment.visits_api_deployment.id
}

# Single OPTIONS method configuration
resource "aws_api_gateway_method" "options" {
  rest_api_id   = aws_api_gateway_rest_api.visits_api.id
  resource_id   = aws_api_gateway_resource.visits_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options" {
  rest_api_id = aws_api_gateway_rest_api.visits_api.id
  resource_id = aws_api_gateway_resource.visits_resource.id
  http_method = aws_api_gateway_method.options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

# Remove or comment out the POST method response
# resource "aws_api_gateway_method_response" "post_200" {
#   rest_api_id = aws_api_gateway_rest_api.visits_api.id
#   resource_id = aws_api_gateway_resource.visits_resource.id
#   http_method = aws_api_gateway_method.post_visit.http_method
#   status_code = "200"
#   
#   response_parameters = {
#     "method.response.header.Access-Control-Allow-Origin"  = true,
#     "method.response.header.Access-Control-Allow-Methods" = true,
#     "method.response.header.Access-Control-Allow-Headers" = true
#   }
# 
#   depends_on = [aws_api_gateway_method.post_visit]
# }

# Remove or comment out the POST integration response
# resource "aws_api_gateway_integration_response" "lambda" {
#   rest_api_id = aws_api_gateway_rest_api.visits_api.id
#   resource_id = aws_api_gateway_resource.visits_resource.id
#   http_method = aws_api_gateway_method.post_visit.http_method
#   status_code = "200"
#   selection_pattern = ""
# 
#   response_parameters = {
#     "method.response.header.Access-Control-Allow-Origin"  = "'*'",
#     "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
#     "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST'"
#   }
# 
#   depends_on = [
#     aws_api_gateway_method.post_visit,
#     aws_api_gateway_integration.lambda_integration
#   ]
# }

resource "aws_api_gateway_method_response" "options_200" {
  rest_api_id = aws_api_gateway_rest_api.visits_api.id
  resource_id = aws_api_gateway_resource.visits_resource.id
  http_method = aws_api_gateway_method.options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "options" {
  rest_api_id = aws_api_gateway_rest_api.visits_api.id
  resource_id = aws_api_gateway_resource.visits_resource.id
  http_method = aws_api_gateway_method.options.http_method
  status_code = aws_api_gateway_method_response.options_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST'",
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  # Add an empty response template
  response_templates = {
    "application/json" = ""
  }
}

output "api_endpoint" {
  value = "https://${aws_api_gateway_rest_api.visits_api.id}.execute-api.${var.aws_region}.amazonaws.com/${var.api_stage}/visit"
}