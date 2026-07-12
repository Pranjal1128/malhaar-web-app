import { getWorkspaceToken, disconnectGoogleWorkspace } from './workspaceAuth';

async function getAuthHeader() {
  const token = getWorkspaceToken();
  if (!token) {
    throw new Error('Google Workspace is not connected. Please authorize in the Workspace Hub.');
  }
  return `Bearer ${token}`;
}

// Unified Google Fetch helper
async function googleApiCall(url: string, options: RequestInit = {}) {
  const authHeader = await getAuthHeader();
  const headers = {
    'Authorization': authHeader,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    if (response.status === 401) {
      disconnectGoogleWorkspace();
    }
    const errorText = await response.text();
    let errorMessage = `Google API Error (${response.status}): ${response.statusText}`;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.error && parsed.error.message) {
        errorMessage = parsed.error.message;
      }
    } catch (e) {
      // Use fallback
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

// ==========================================
// 1. GOOGLE CALENDAR API SERVICES
// ==========================================

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  htmlLink?: string;
  hangoutLink?: string;
}

export async function listCalendarEvents(): Promise<CalendarEvent[]> {
  const timeMin = new Date().toISOString();
  // Fetch up to 25 events, ordered by start time
  const data = await googleApiCall(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=25&orderBy=startTime&singleEvents=true&timeMin=${encodeURIComponent(timeMin)}`
  );
  return data.items || [];
}

export async function createCalendarEvent(
  summary: string,
  description: string,
  startTime: string,
  endTime: string,
  createMeet: boolean = false
): Promise<CalendarEvent> {
  const body: any = {
    summary,
    description,
    start: {
      dateTime: startTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    end: {
      dateTime: endTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  };

  if (createMeet) {
    body.conferenceData = {
      createRequest: {
        requestId: `meet_${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' }
      }
    };
  }

  const queryParams = createMeet ? '?conferenceDataVersion=1' : '';
  return googleApiCall(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events${queryParams}`,
    {
      method: 'POST',
      body: JSON.stringify(body)
    }
  );
}

// ==========================================
// 2. GOOGLE MEET API SERVICES
// ==========================================

export interface MeetSpace {
  name: string;
  meetingUri: string;
  meetingCode: string;
}

export async function createInstantMeetSpace(): Promise<MeetSpace> {
  // Use Meet REST API v2
  return googleApiCall('https://meet.googleapis.com/v2/spaces', {
    method: 'POST',
    body: JSON.stringify({})
  });
}

// ==========================================
// 3. GOOGLE DRIVE API SERVICES
// ==========================================

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  iconLink?: string;
  createdTime?: string;
}

export async function listDriveFiles(): Promise<DriveFile[]> {
  // List files that are NOT in trash, sort by modified time
  const data = await googleApiCall(
    `https://www.googleapis.com/drive/v3/files?pageSize=20&orderBy=modifiedTime%20desc&fields=files(id,name,mimeType,webViewLink,iconLink,createdTime)&q=trashed%20%3D%20false`
  );
  return data.files || [];
}

export async function uploadTextFileToDrive(fileName: string, textContent: string): Promise<DriveFile> {
  const token = getWorkspaceToken();
  if (!token) {
    throw new Error('Google Workspace is not connected. Please authorize.');
  }

  // To set both metadata (like name) and content, we use a multipart request
  const boundary = 'foo_bar_baz_boundary';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName,
    mimeType: 'text/plain'
  };

  const multipartBody = 
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/plain; charset=UTF-8\r\n\r\n' +
    textContent +
    closeDelimiter;

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,iconLink', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartBody
  });

  if (!response.ok) {
    throw new Error(`Failed to upload file to Google Drive: ${response.statusText}`);
  }

  return response.json();
}

// ==========================================
// 4. GMAIL API SERVICES
// ==========================================

export interface GmailMessage {
  id: string;
  threadId: string;
  subject?: string;
  snippet?: string;
  from?: string;
  date?: string;
}

export async function listRecentEmails(): Promise<GmailMessage[]> {
  // 1. Fetch message IDs list
  const data = await googleApiCall(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=8'
  );

  const messages: GmailMessage[] = [];
  if (data.messages && data.messages.length > 0) {
    // 2. Fetch details for each message
    const detailsPromises = data.messages.map(async (msg: any) => {
      try {
        const detail = await googleApiCall(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`
        );
        
        const headers = detail.payload?.headers || [];
        const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === 'subject');
        const fromHeader = headers.find((h: any) => h.name.toLowerCase() === 'from');
        const dateHeader = headers.find((h: any) => h.name.toLowerCase() === 'date');

        return {
          id: detail.id,
          threadId: detail.threadId,
          snippet: detail.snippet,
          subject: subjectHeader ? subjectHeader.value : '(No Subject)',
          from: fromHeader ? fromHeader.value : '(Unknown Sender)',
          date: dateHeader ? dateHeader.value : ''
        };
      } catch (err) {
        console.warn(`Could not load email detail for ${msg.id}:`, err);
        return null;
      }
    });

    const resolved = await Promise.all(detailsPromises);
    resolved.forEach(m => {
      if (m) messages.push(m);
    });
  }

  return messages;
}

export async function sendGmailEmail(to: string, subject: string, htmlBody: string): Promise<any> {
  // Build standard RFC 2822 raw email string
  const str = [
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
    '',
    htmlBody,
  ].join('\r\n');

  // Base64url encode
  const rawBase64Url = btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return googleApiCall(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      body: JSON.stringify({ raw: rawBase64Url })
    }
  );
}

// ==========================================
// 5. GOOGLE SHEETS API SERVICES
// ==========================================

export async function createGoogleSpreadsheet(title: string): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const data = await googleApiCall('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    body: JSON.stringify({
      properties: {
        title
      }
    })
  });

  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`
  };
}

export async function appendSpreadsheetValues(
  spreadsheetId: string,
  range: string,
  values: string[][]
): Promise<any> {
  return googleApiCall(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      body: JSON.stringify({
        values
      })
    }
  );
}

export async function exportToGoogleSheets(title: string, headers: string[], rows: string[][]): Promise<string> {
  // 1. Create spreadsheet
  const { spreadsheetId, spreadsheetUrl } = await createGoogleSpreadsheet(title);
  
  // 2. Append headers and data
  const fullValues = [headers, ...rows];
  await appendSpreadsheetValues(spreadsheetId, 'Sheet1!A1', fullValues);

  return spreadsheetUrl;
}
