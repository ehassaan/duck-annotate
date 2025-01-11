
import { Account } from "better-auth/types";
import { db } from "../services/db";
import * as q from "../libs/queryHelper";

// async function addConnectedAccount(account: Account) {
//     const res = await db.query('INSERT INTO account (provider, providerAccountId, userId) VALUES ($1, $2, $3)', [account.providerId, account.accountId, account.userId]);
//     return res;
// }

export async function upsertConnectedAccount(account: Partial<Account>) {

    const partialUpdate = q.partialUpsert('account', ['providerId', 'accountId', 'userId'], account);
    console.log("Query: ", partialUpdate);
    if (partialUpdate === null) return null;

    const res = await db.query(partialUpdate.query, partialUpdate.params);
    return res;
}


export async function getConnectedAccounts(userId: string) {

    const accounts = await db.query(`SELECT 
        "accountId",
        "providerId", 
        "accessToken", 
        "accessTokenExpiresAt", 
        "refreshToken", 
        "refreshTokenExpiresAt" 
        FROM account 
        WHERE "userId" = $1`,
        [userId]);

    return accounts;
}
