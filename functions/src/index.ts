import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();
import * as foodModule from './food';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
export const food: functions.HttpsFunction = foodModule.food;
