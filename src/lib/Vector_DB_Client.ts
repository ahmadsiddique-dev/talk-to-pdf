import { MongoClient } from "mongodb"
import 'dotenv/config'

const client = new MongoClient(process.env['MONGODB_ATLAS_URI']!);

export const collection = client
    .db(process.env['MONGODB_ATLAS_DB_NAME'])
    .collection(process.env['MONGODB_ATLAS_COLLECTION_NAME'] as string);