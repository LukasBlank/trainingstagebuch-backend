import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const calories: functions.HttpsFunction = functions
  .region('europe-west3')
  .https.onRequest(
    async (request: functions.https.Request, response: functions.Response) => {
      switch (request.method) {
        case 'OPTIONS':
          response.set('Access-Control-Allow-Methods', ['GET', 'POST']);
          response.set('Access-Control-Allow-Headers', [
            'authorization',
            'date',
          ]);
          response.status(204).send('');
          break;
        case 'GET':
          await getDay(request, response);
          break;
        case 'POST':
          await updateDay(request, response);
          break;
        default:
          response.status(405).send('Method not allowed.');
      }
    }
  );

async function getDay(
  request: functions.https.Request,
  response: functions.Response
) {
  const decoded = await authorize(request);
  if (decoded && request.headers.date) {
    try {
      const list = await admin
        .firestore()
        .collection('user/' + decoded.uid + '/food')
        .where('date', '==', request.headers.date)
        .get();
      if (list.size === 1) {
        response
          .status(200)
          .send({ id: list.docs[0].id, data: list.docs[0].data() });
      } else if (list.size === 0) {
        const user = await admin
          .firestore()
          .doc('user/' + decoded.uid)
          .get();
        const doc = await admin
          .firestore()
          .collection('user/' + decoded.uid + '/food')
          .add({
            date: request.headers.date,
            notes: '',
            current: 0,
            breakfast: [],
            dinner: [],
            lunch: [],
            goal: user.get('goal'),
          });
        const res = await doc.get();
        response.status(200).send({ id: res.id, data: res.data() });
      } else {
        response.status(404).send('Unexpected amount of documents found.');
      }
    } catch (err) {
      response.status(400).send(err);
    }
  } else if (!request.headers.date) {
    response.status(400).send('Date is missing.');
  } else {
    response.status(408).send('Unauthorized.');
  }
}

async function updateDay(
  request: functions.https.Request,
  response: functions.Response
) {
  const decoded = await authorize(request);
  if (decoded) {
    try {
      const data = JSON.parse(request.body);
      const day_id = data.id;
      delete data.id;

      const res = await admin
        .firestore()
        .doc('user/' + decoded.uid + '/food/' + day_id)
        .set(data);
      response.status(200).send(res);
    } catch (err) {
      response.status(400).send(err);
    }
  } else if (decoded) {
    response.status(400).send('Body is missing.');
  } else {
    response.status(408).send('Unauthorized.');
  }
}

async function authorize(
  request: functions.https.Request
): Promise<admin.auth.DecodedIdToken | null> {
  if (
    !request.headers.authorization ||
    !request.headers.authorization.startsWith('Bearer ')
  ) {
    return null;
  } else {
    const token = request.headers.authorization.substring(7);
    try {
      const decoded: admin.auth.DecodedIdToken = await admin
        .auth()
        .verifyIdToken(token);
      return decoded;
    } catch (err) {
      return null;
    }
  }
}
