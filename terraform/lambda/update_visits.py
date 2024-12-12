import json
import boto3
import os
from datetime import datetime
from botocore.exceptions import ClientError
from decimal import Decimal

def get_cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'OPTIONS,POST'
    }

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def lambda_handler(event, context):
    # Always include CORS headers
    headers = get_cors_headers()
    
    # Handle OPTIONS request
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'message': 'OK'})
        }

    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])
    
    # Parse the request body
    try:
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('user_id')
        
        if not user_id:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'user_id is required'})
            }
            
        # Get today's date in ISO format (YYYY-MM-DD)
        visit_date = datetime.utcnow().date().isoformat()
        
        # Update or create the visit record
        try:
            response = table.update_item(
                Key={
                    'visit_date': visit_date,
                    'user_id': user_id
                },
                UpdateExpression='ADD visit_count :inc',
                ExpressionAttributeValues={
                    ':inc': 1
                },
                ReturnValues='UPDATED_NEW'
            )
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'message': 'Visit recorded successfully',
                    'visit_count': response['Attributes'].get('visit_count', 1)
                }, default=decimal_default)
            }
            
        except ClientError as e:
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': str(e)})
            }
            
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Invalid JSON in request body'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }
