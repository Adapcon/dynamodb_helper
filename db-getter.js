// Load the AWS SDK for Node.js
const AWS = require('aws-sdk');
const fs = require('fs');

try {
  // Set the region
  AWS.config.update({ region: 'sa-east-1' });
  const filename = './Activity.Computed.json';

  const args = process.argv.slice(2);
  if (args.length !== 3) {
    throw new Error(`
        Script needs 3 params, but ${args.length} was passed. \n
        $0 -> DynamoDB Database Name, $1 -> HashKey name, $2 -> HashKey value \n
    `);
  }
  const [database, hashKeyName, hashKeyValue] = args;

  // Create DynamoDB service object
  const ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });

  const params = {
    ExpressionAttributeValues: {
      ':id': { S: hashKeyValue },
    },
    KeyConditionExpression: `${hashKeyName} = :id`,
    TableName: database,
  };

  ddb.query(params, async (err, data) => {
    if (err)
      console.log('Error', err);

    console.log(`${data.Items.length} records. Saving file...`);

    await fs.writeFileSync(filename, '[');

    await data.Items.map(async (element, index) => {
      const append = index === data.Items.length - 1 ? '' : ',';
      const record = JSON.stringify(element) + append;
      await fs.appendFileSync(filename, record);
    });

    console.log('Saved!');
    await fs.appendFileSync(filename, ']');
  });
} catch (error) {
  console.log(error);
}
