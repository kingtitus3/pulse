'use client'

interface PulseWindowShellProps {
  title: string
  children: React.ReactNode
}

export default function PulseWindowShell({
  title,
  children,
}: PulseWindowShellProps) {
  return (
    <div className="w-full h-full flex flex-col">
      {/* Yahoo-style header */}
      <div className="yahoo-header flex-shrink-0">
        {title}
      </div>
      {/* Content */}
      <div className="flex-1 bg-yahoo-chatBg overflow-hidden" style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}

