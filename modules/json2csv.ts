import { Parser } from '@json2csv/plainjs';
import * as fsPromise from 'fs/promises';
import obj from '../jsonFiles/4.json'
import yargs from 'yargs';


const run = async () => {
    const clearedJson = []

    Object.keys(obj).map(item => {
        const { Item } = obj[item]
        // console.log('Item', Item)
        if(Item?.status?.S === 'active') {
            const newItem = {
                id: Item?.id?.S ?? '',
                email: Item?.email?.S ?? '',
                phone: Item?.phone?.S ?? '',
                nick: Item?.nick?.S ?? ''
            }
            clearedJson.push(newItem)
        }
    })
    const parser = new Parser({ delimiter: ',' })
    const csv = parser.parse(clearedJson)
    console.log('data', csv)

    await fsPromise.writeFile('./csvFiles/4.csv', csv)
}

run()
