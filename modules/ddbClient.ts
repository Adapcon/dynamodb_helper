// Create service client module using ES6 syntax.
import aws from 'aws-sdk';
// Set the AWS Region.
const REGION = 'sa-east-1'; // e.g. "us-east-1"
aws.config.update({ region: REGION });
// Create an Amazon DynamoDB service client object
const ddbClient = new aws.DynamoDB.DocumentClient();
export { ddbClient };
