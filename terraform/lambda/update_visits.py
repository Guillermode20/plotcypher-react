import json
import boto3
import os
from datetime import datetime
from botocore.exceptions import ClientError

def lambda_handler(event, context):
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])
    
    # Parse the request body
    try:
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('user_id')
        
        if not user_id:
            return {
                'statusCode': 400,
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
                'body': json.dumps({
                    'message': 'Visit recorded successfully',
                    'visit_count': response['Attributes'].get('visit_count', 1)
                })
            }
            
        except ClientError as e:
            return {
                'statusCode': 500,
                'body': json.dumps({'error': str(e)})
            }
            
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Invalid JSON in request body'})
        }
