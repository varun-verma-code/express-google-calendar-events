import express from 'express';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();
// console.log(process.env);
const app = express();
const port = process.env.PORT | '3000';

app.use(express.json());

/*
Replace with your Google Calendar API credentials

For now, this is a simple Google Calendar integration and DOES NOT cover creation of OAuth Tokens
Generate the OAuth token via Postman using your ClientID/ClientSecret OR use the express-passport-google-oidc-sqlite to login and get the token from the console log
Paste that token into the .env file to get the API's to work

Later, we can integrate the passport-oidc with this project to ensure everything can be done within this self contained application
*/
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

// Authenticate to Google Calendar API
const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
auth.setCredentials({ refresh_token: REFRESH_TOKEN });

const calendar = google.calendar({ version: 'v3', auth });

// GET events
app.get('/events', async (req, res) => {
  const response = await calendar.events.list({
    calendarId: 'primary',
    singleEvents: true,
    // timeMin: '2024-11-20T00:00:00.000Z', // Filter by min time
    // timeMax: '2024-11-21T00:00:00.000Z', // Filter by max time
    timeZone: 'America/Los_Angeles',
    orderBy: 'startTime',
  });
  res.json(response.data.items);
});

// Create a new calendar event
app.post('/event', async (req, res) => {
  const { summary, startDateTime, endDateTime } = req.body;

  const event = {
    summary,
    start: {
      dateTime: startDateTime,
      timeZone: 'America/Los_Angeles', // Adjust timezone as needed
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'America/Los_Angeles',
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).send('Error creating event');
  }
});

// Update an existing calendar event
app.put('/event/:eventId', async (req, res) => {
  const eventId = req.params.eventId;
  const { summary, startDateTime, endDateTime } = req.body;

  const event = {
    summary,
    start: {
      dateTime: startDateTime,
      timeZone: 'America/Los_Angeles',
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'America/Los_Angeles',
    },
  };

  try {
    const response = await calendar.events.patch({
      calendarId: 'primary',
      eventId,
      resource: event,
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).send('Error updating event');
  }
});

// Delete an existing calendar event
app.delete('/event/:eventId', async (req, res) => {
  const eventId = req.params.eventId;

  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });
    res.send('Event deleted successfully');
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).send('Error deleting event');
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

/*
This works. However, the token is generated separately in postman and pasted in this script. Next steps will be to make the call from express to get token and use in the code.

1. Go to Postman > Workspaces > Google APIs > OAuth Flow > 1. Auth Request. Click on Get New Access Token and after redirect click on Use Token, that will be saved.
2. Copy that token and paste in the script above
3. Run this server and call the endpoints in Postman > Workspaces > Google APIs > express-google-calendar-events

*/
