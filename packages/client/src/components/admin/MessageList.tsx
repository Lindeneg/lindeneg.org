import type { ContactMessageResponse } from '@shared';
import MessageCard from './MessageCard';

interface MessageListProps {
  messages: ContactMessageResponse[];
  onChanged: () => void;
}

export default function MessageList({ messages, onChanged }: MessageListProps) {
  return (
    <div className="space-y-3">
      {messages.map((msg) => (
        <MessageCard key={msg.id} message={msg} onChanged={onChanged} />
      ))}
    </div>
  );
}
