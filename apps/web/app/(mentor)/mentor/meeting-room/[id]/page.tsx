'use client'
import MeetingRoomView from '@/components/shared/MeetingRoomView'

export default function MentorMeetingRoom({ params }: { params: { id: string } }) {
  return <MeetingRoomView meetingId={params.id} backPath="/mentor/calendar" />
}
