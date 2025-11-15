'use client'

import { useChatStore, type Room } from '@/store/useChatStore'

interface RoomListProps {
  onSelectRoom: (slug: string) => void
}

export default function RoomList({ onSelectRoom }: RoomListProps) {
  const { rooms, currentRoomSlug } = useChatStore()

  console.log('RoomList render - rooms count:', rooms.length, 'rooms:', rooms)

  const coreRooms = rooms.filter((r) => r.type === 'core')
  const topicRooms = rooms.filter((r) => r.type === 'topic' && !r.archived)

  return (
    <div className="w-56 bg-yahoo-sidebar border-r-2 border-yahoo-border h-screen overflow-y-auto">
      <div className="p-2">
        <div className="yahoo-header mb-2 text-xs">
          Chat Rooms
        </div>
        {coreRooms.length === 0 && topicRooms.length === 0 ? (
          <div className="text-xs text-yahoo-textMuted p-2">
            No rooms available.
            <br />
            <span className="text-[10px]">
              Set up database to see rooms.
            </span>
          </div>
        ) : (
          <>
            {coreRooms.length === 0 ? (
              <div className="text-xs text-yahoo-textMuted px-2 py-1">
                No rooms
              </div>
            ) : (
              coreRooms.map((room) => (
                <RoomListItem
                  key={room.id}
                  room={room}
                  isActive={room.slug === currentRoomSlug}
                  onClick={() => onSelectRoom(room.slug)}
                />
              ))
            )}

            {topicRooms.length > 0 && (
              <>
                <div className="text-xs font-bold text-yahoo-textMuted mb-1 mt-3 px-2">
                  Topics
                </div>
                {topicRooms.map((room) => (
                  <RoomListItem
                    key={room.id}
                    room={room}
                    isActive={room.slug === currentRoomSlug}
                    onClick={() => onSelectRoom(room.slug)}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function RoomListItem({
  room,
  isActive,
  onClick,
}: {
  room: Room
  isActive: boolean
  onClick: () => void
}) {
  return (
    <div
      className={`px-2 py-1.5 text-sm cursor-pointer border-b border-yahoo-border ${
        isActive
          ? 'bg-yahoo-header text-yahoo-headerText font-bold'
          : 'hover:bg-yahoo-messageHover text-yahoo-text'
      }`}
      onClick={onClick}
    >
      {room.shortName}
    </div>
  )
}

