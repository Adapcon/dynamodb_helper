try {
    // Load the AWS SDK for Node.js
    var AWS = require('aws-sdk');
    const fs = require('fs')
    // Set the region
    AWS.config.update({region: 'sa-east-1'});
    const filename = './Activity.Computed.json'

    const args = process.argv.slice(2);
    if(args.length !== 3) throw(`
        Script needs 3 params, but ${args.length} was passed. \n
        $0 -> DynamoDB Database Name, $1 -> HashKey name, $2 -> HashKey value \n 
    `)
    const [database, hashKeyName, hashKeyValue] = args

    // Create DynamoDB service object
    var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

    var params = {
        ExpressionAttributeValues: {
            ':id': {S: hashKeyValue},
        },
        KeyConditionExpression: `${hashKeyName} = :id`,
        TableName: database
    };

    ddb.query(params, function(err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            data.Items.forEach(function(element, index, array) {
                fs.appendFile(filename, JSON.stringify(element) + ',', function (err) {
                    if (err) throw err;
                    console.log('Saved!');
                });
            });
        }
    });
} catch (error) {
    console.log(error)
}
