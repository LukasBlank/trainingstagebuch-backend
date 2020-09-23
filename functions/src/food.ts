import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const food: functions.HttpsFunction = functions
  .region('europe-west3')
  .https.onRequest(
    async (request: functions.https.Request, response: functions.Response) => {
      switch (request.method) {
        case 'OPTIONS':
          response.set('Access-Control-Allow-Methods', ['GET', 'POST']);
          response.set('Access-Control-Allow-Headers', ['authorization']);
          response.status(204).send('');
          break;
        case 'GET':
          await getFoods(request, response);
          break;
        default:
          response.status(405).send('Method not allowed.');
      }
    }
  );

async function getFoods(
  request: functions.https.Request,
  response: functions.Response
) {
  try {
    const docs = await admin.firestore().collection('food').get();
    const data: any[] = [];
    docs.forEach((doc) => {
      const docdata = doc.data();
      docdata['id'] = doc.id;
      data.push(docdata);
    });
    response.status(200).send(data);
  } catch (err) {
    response.status(400).send(err);
  }
}
