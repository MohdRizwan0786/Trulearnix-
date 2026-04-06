import axios from 'axios';

const getZoomToken = async (): Promise<string> => {
  const credentials = Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString('base64');
  const res = await axios.post(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
    {},
    { headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return res.data.access_token;
};

export const createZoomMeeting = async (topic: string, startTime: Date, duration: number) => {
  const token = await getZoomToken();
  const res = await axios.post(
    'https://api.zoom.us/v2/users/me/meetings',
    {
      topic,
      type: 2,
      start_time: startTime.toISOString(),
      duration,
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: true,
        auto_recording: 'cloud',
        waiting_room: true
      }
    },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );
  return {
    meetingId: res.data.id.toString(),
    joinUrl: res.data.join_url,
    startUrl: res.data.start_url,
    password: res.data.password
  };
};

export const deleteZoomMeeting = async (meetingId: string) => {
  const token = await getZoomToken();
  await axios.delete(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
