// Import required AWS SDK clients and commands for Node.js
import { ddbClient } from './ddbClient';
import {
  DynamoDbRecord,
  DynamoDbScan,
  Arguments,
  ScannedData
} from './interfaces';
import yargs from 'yargs';
import {setTimeout} from "timers/promises"

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
})
.option('executeQuery', {
  alias: 'q',
  description: 'Do a query instead of scan to search for records to delete'
}).argv as Arguments

console.log('Execution Args', args)
const {
  appId,
  table,
  onlyValidate,
  limit,
  stopOnLimit,
  exclude,
  partitionKey,
  sortKey,
  clientProp,
  executeQuery
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
    if(executeQuery)
      await handleQuery()
    else
      await handleScan()
  } catch (err) {
    console.error(err);
  }
};

const handleQuery = async () => {
  blockedAppIds.map(async (appId) => {
    const search: {[key: string]: any} = await query({
      partitionKeyName: clientProp,
      partitionKeyValue: appId
    })
    let { LastEvaluatedKey }: any = search

    const {Items: items} = search
    console.log('Found: ', items?.length)
    if(items && items?.length) {
      await removerValidation(items)
    }

    const scanMorePages = !(!!limit && !!stopOnLimit)
    const hasMorePages = !!LastEvaluatedKey

    if(scanMorePages && hasMorePages && items?.length) {
      do {
        const newData = await await query({
          partitionKeyName: clientProp,
          partitionKeyValue: appId,
          LastEvaluatedKey
        })
        LastEvaluatedKey = newData.LastEvaluatedKey
        console.log('Next Page: --> ', LastEvaluatedKey)
        if(newData.Items) {
          const {Items: items} = newData
          if(items && items?.length) {
            await removerValidation(items)
          }
        }
        await setTimeout(1000)
      } while (typeof LastEvaluatedKey !== 'undefined')
    }
  })
}

const handleScan = async () => {
  const search: {[key:string]:any} = await scan()
  let { LastEvaluatedKey }: any = search

  const {Items: items} = search
  console.log('Found: ', items?.length)
  if(items && items?.length) {
    await removerValidation(items)
  }

  const scanMorePages = !(!!limit && !!stopOnLimit)
  const hasMorePages = !!LastEvaluatedKey

  if(scanMorePages && hasMorePages && items?.length) {
    do {
      const newData = await scan(LastEvaluatedKey)
      LastEvaluatedKey = newData.LastEvaluatedKey
      console.log('Next Page: --> ', LastEvaluatedKey)
      if(newData.Items) {
        const {Items: items} = newData
        if(items && items?.length) {
          await removerValidation(items)
        }
      }
      await setTimeout(1000)
    } while (typeof LastEvaluatedKey !== 'undefined')
  }
}

const removerValidation = async (items: {}) => {
  const toRemove = recordVerifier(items as [DynamoDbRecord]) as [DynamoDbRecord]

  const chunksOfData: ScannedData[][] = assembleChunksOfObjects(toRemove, 100) as []
  chunksOfData.forEach(async element => {
    const promiseRemove = element.map(async item => remove(item))
    await Promise.all(promiseRemove)
  });

  console.log('Records removed: ', toRemove.length)
}

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

const query = async ({
  partitionKeyName,
  partitionKeyValue,
  LastEvaluatedKey,
}:{
  partitionKeyName: string,
  partitionKeyValue: string
  LastEvaluatedKey?: {key: string},
}): Promise<DynamoDbScan> => {
  const KeyConditionExpression = `${partitionKeyName} = :clientProp`
  const fields = [ `#${partitionKey}`, `#${sortKey}` ]
  const ProjectionExpression = [...new Set(fields.filter(field => field.length))].join(', ')
  const ExpressionAttributeNames = {
    [`#${partitionKey}`]: partitionKey,
    [`#${sortKey}`]: sortKey
  }
  const ExpressionAttributeValues = {
    ':clientProp': partitionKeyValue
  }
  const params = {
    ...defaultParams,
    KeyConditionExpression,
    ProjectionExpression,
    ExpressionAttributeValues,
    ExpressionAttributeNames,
    ...!!LastEvaluatedKey ? {ExclusiveStartKey: LastEvaluatedKey} : {},
  }

  return new Promise(async (resolve, reject) => {
    await ddbClient.query(params, (err, data) => {
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

const assembleChunksOfObjects = (
  scannedData: ScannedData[],
  chunkSize: number
): ScannedData[][] => {
  const chunks: ScannedData[][] = [];
  for (let i = 0; i < scannedData.length; i += chunkSize) {
    chunks.push(scannedData.slice(i, i + chunkSize));
  }
  return chunks;
};



run();
