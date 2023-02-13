// Import required AWS SDK clients and commands for Node.js
import { ddbClient } from './ddbClient';
import {
  DynamoDbRecord,
  DynamoDbScan,
  Arguments,
} from './interfaces';
import yargs from 'yargs';

const args: Arguments = yargs
.option('table', {
  alias: 't',
  description: 'Table Name',
  demandOption: true
})
.option('only-validate', {
  type: 'boolean',
  alias: 'v',
  description: 'Only Show. Does not delete Records'
})
.option('appId', {
  alias: 'a',
  description: 'AppIds to Save or Destroy',
  demandOption: true
})
.option('limit', {
  type: 'number',
  alias: 'l',
  description: 'Do the scan in just a bunch of records'
})
.option('stop-on-limit', {
  type: 'boolean',
  alias: 's',
  description: 'Stop on limit'
})
.option('exclude', {
  type: 'boolean',
  alias: 'e',
  description: 'Exclusive Option. Runs the scan and exclude records that AppId === AppIds passed'
})
.option('partitionKey', {
  alias: 'pk',
  description: 'PartitionKey key in Record',
  demandOption: true
})
.option('sortKey', {
  alias: 'sk',
  type: 'string',
  description: 'SortKey key in Record',
})
.option('clientProp', {
  alias: 'p',
  description: 'Custom prop that saves the client\'s ID (Default is appId)'
}).argv as Arguments

console.log('args', args)
const {
  appId,
  table,
  onlyValidate,
  limit,
  stopOnLimit,
  exclude,
  partitionKey,
  sortKey,
  clientProp
} = args
const blockedAppIds = appId.split(',')
const clientIdProp = clientProp ? clientProp : 'appId'

// Set the parameters
const defaultParams = {
  TableName: table,
  Limit: limit,
};


const run = async () => {
  try {
    let scanned = await scan()
    let { LastEvaluatedKey }: any = scanned
    if(!(!!limit && !!stopOnLimit) && !!LastEvaluatedKey && scanned.Items?.length) {
      do {
        const newData = await scan(LastEvaluatedKey)
        if(newData.Items)
          scanned.Items.push(...newData.Items)
        LastEvaluatedKey = newData.LastEvaluatedKey
      } while (typeof LastEvaluatedKey !== 'undefined')
    }

    const {Items: items} = scanned
    console.log('Total: ', items?.length)
    if(items && items?.length) {
      const toRemove = recordVerifier(items as [DynamoDbRecord]) as [DynamoDbRecord]
      const promiseRemove = toRemove.map(async item => remove(item))
      Promise.all(promiseRemove)
      console.log('Records removed: ', toRemove.length)
    }
  } catch (err) {
    console.error(err);
  }
};

const scan = async (LastEvaluatedKey?: {LastEvaluatedKey: {key: string}}): Promise<DynamoDbScan> => {
  const fields = [ partitionKey, sortKey, clientIdProp ]
  const ProjectionExpression = [...new Set(fields.filter(field => field.length))].join(', ')
  return new Promise(async (resolve, reject) => {
    await ddbClient.scan({
        ...defaultParams,
        ...!!LastEvaluatedKey ? {ExclusiveStartKey: LastEvaluatedKey} : {},
        ProjectionExpression
      }, (err, data) => {
        if(err)
          reject(err)
        resolve(data as DynamoDbScan)
      })
  })
}

const remove = async (item: DynamoDbRecord): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    if(onlyValidate)
      console.log('item Deleted', item)
    else {
      const params = {
        ...defaultParams,
        Key: {
          [partitionKey]: item[partitionKey],
          ...sortKey ? { [sortKey]: item[sortKey] } : {}
        }
      }
      await ddbClient.delete(params, (err, data) => {
        if(err)
          reject(err)
        resolve(data)
      })
    }
  })
}

const recordVerifier = (items: [DynamoDbRecord]|[]): [DynamoDbRecord]|[] => {
  if(!items.length) return []
  const filtered = items.filter(item => {
    return !exclude ? !blockedAppIds.some(appId => {
      return appId === item[clientIdProp]
    }) : blockedAppIds.some(appId => {
      return appId === item[clientIdProp]
    })
  })
  console.log('Filtered Records', filtered, filtered.length)
  return filtered as [DynamoDbRecord]
}



run();
