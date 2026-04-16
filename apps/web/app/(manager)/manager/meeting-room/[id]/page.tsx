'use client'
import MeetingRoomView from '@/components/shared/MeetingRoomView'

export default function ManagerMeetingRoom({ params }: { params: { id: string } }) {
  return <MeetingRoomView meetingId={params.id} backPath="/manager/calendar" />
}
