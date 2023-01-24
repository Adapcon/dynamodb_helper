export interface DynamoDbRecord {
  [key: string]: string
}

export interface Arguments {
  _: any
  table: string;
  appId: string;
  onlyValidate: boolean;
  limit: number;
  stopOnLimit: boolean
  exclude: boolean
  partitionKey: string
  sortKey: string
  clientProp: string
}

export interface DynamoDbScan {
  Items?: [{[key: string]: string}]
  Count?: number
  ScannedCount?: number
  LastEvaluatedKey?: {[key:string]: string}
}
