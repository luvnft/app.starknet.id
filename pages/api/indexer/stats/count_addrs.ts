import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../../../lib/mongodb";
import { queryError } from "../domain_to_addr";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<{
        count: number;
    } | queryError>
) {
    const { query: { since }, } = req;
    const sinceTime = parseInt(since as string) * 1000;
    const { db } = await connectToDatabase();
    const domainCollection = db.collection("starknet_ids");

    await domainCollection.aggregate([
        {
            '$match': {
                '_chain_valid_to': null,
                'creation_date': {
                    '$gte': new Date(sinceTime),
                }
            }
        }, {
            '$group': {
                '_id': '$owner'
            }
        }, {
            '$count': 'total'
        }
    ]).toArray().then((docs) => {
        const doc = docs.at(0);
        res
            .setHeader("cache-control", "max-age=30")
            .status(200)
            .json({
                count: doc ? doc.total : 0
            });
    });

}
