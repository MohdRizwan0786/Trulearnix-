'use client'
import MeetingRoomView from '@/components/shared/MeetingRoomView'

export default function SalesMeetingRoom({ params }: { params: { id: string } }) {
  return <MeetingRoomView meetingId={params.id} backPath="/sales/calendar" />
}
