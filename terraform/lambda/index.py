import json
import boto3
import os
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
ec2 = boto3.client('ec2')

def handler(event, context):
    """
    Lambda function to stop EC2 instance when budget threshold is reached
    """
    try:
        # Get instance ID from environment variable
        instance_id = os.environ.get('INSTANCE_ID')
        project_name = os.environ.get('PROJECT_NAME', 'cactus-dashboard')
        
        if not instance_id:
            logger.error("INSTANCE_ID environment variable not set")
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'INSTANCE_ID not configured'})
            }
        
        logger.info(f"Processing budget alert for instance {instance_id}")
        
        # Check if instance exists and is running
        response = ec2.describe_instances(
            InstanceIds=[instance_id],
            Filters=[
                {
                    'Name': 'tag:Project',
                    'Values': [project_name]
                }
            ]
        )
        
        if not response['Reservations']:
            logger.error(f"Instance {instance_id} not found or not tagged with Project={project_name}")
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Instance not found'})
            }
        
        instance = response['Reservations'][0]['Instances'][0]
        instance_state = instance['State']['Name']
        
        logger.info(f"Instance {instance_id} current state: {instance_state}")
        
        # Only stop if instance is running
        if instance_state == 'running':
            logger.info(f"Stopping instance {instance_id} due to budget threshold")
            
            # Stop the instance
            stop_response = ec2.stop_instances(
                InstanceIds=[instance_id],
                Hibernate=False
            )
            
            logger.info(f"Stop request initiated: {stop_response}")
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': f'Instance {instance_id} stopped due to budget threshold',
                    'instance_state': instance_state,
                    'stop_response': stop_response
                })
            }
        else:
            logger.info(f"Instance {instance_id} is already {instance_state}, no action needed")
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': f'Instance {instance_id} is already {instance_state}',
                    'instance_state': instance_state
                })
            }
            
    except Exception as e:
        logger.error(f"Error processing budget alert: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        } 